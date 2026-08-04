import logging
import os
from datetime import date, timedelta
from django.conf import settings
from django.core.management.base import BaseCommand
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution
from django_apscheduler import util
from google.oauth2 import service_account
from googleapiclient.discovery import build
from hostel.models import Student, Voucher, CalendarEvent

logger = logging.getLogger(__name__)

def push_event_to_google_calendar(title, event_date, description=""):
    try:
        creds_file = os.path.join(settings.BASE_DIR, 'google_credentials.json')
        if not os.path.exists(creds_file):
            logger.warning("Google credentials not found at %s. Skipping calendar sync.", creds_file)
            return

        SCOPES = ['https://www.googleapis.com/auth/calendar']
        creds = service_account.Credentials.from_service_account_file(creds_file, scopes=SCOPES)
        
        service = build('calendar', 'v3', credentials=creds)
        
        event = {
          'summary': title,
          'description': description,
          'start': {
            'date': event_date.strftime("%Y-%m-%d"),
          },
          'end': {
            'date': event_date.strftime("%Y-%m-%d"),
          },
        }
        
        # We will use 'primary' for the service account's own calendar
        # You can share this service account email with your personal Google Calendar
        event_result = service.events().insert(calendarId='primary', body=event).execute()
        logger.info('Google Calendar Event created: %s', event_result.get('htmlLink'))
        return event_result.get('htmlLink')
    except Exception as e:
        logger.error(f"Failed to create Google Calendar event: {e}")
        return None

def generate_vouchers_job():
    logger.info("Running voucher generation job...")
    today = date.today()
    students = Student.objects.all()
    
    for student in students:
        days_enrolled = (today - student.join_date).days
        
        # Every 15 days, generate a new voucher (skipping day 0 if needed, but let's say exactly at 15, 30, 45)
        if days_enrolled > 0 and days_enrolled % 15 == 0:
            billing_start = today
            billing_end = today + timedelta(days=14)
            due_date = today + timedelta(days=5) # Due in 5 days
            
            # Prevent duplicate voucher for the same billing start date
            if Voucher.objects.filter(student=student, billing_cycle_start=billing_start).exists():
                logger.info(f"Voucher already exists for {student.name} for cycle {billing_start}")
                continue
                
            rent = float(student.rent_price) if str(student.rent_price).replace('.', '', 1).isdigit() else 3000.00
            
            voucher = Voucher.objects.create(
                student=student,
                enrollment_date=student.join_date,
                billing_cycle_start=billing_start,
                billing_cycle_end=billing_end,
                due_date=due_date,
                rent_amount=rent,
                electricity_charges=0,
                other_charges=0,
                status='Unpaid'
            )
            logger.info(f"Generated Voucher #{voucher.voucher_no} for {student.name}")
            
            # 2. Sync to Calendar
            title = f"Rent Due: {student.name} (Room {student.room_no})"
            desc = f"Voucher #{voucher.voucher_no} for {student.name} is due today. Amount: {voucher.total_amount}"
            
            # Local DB Calendar Event
            CalendarEvent.objects.create(
                student=student,
                title=title,
                event_type='Rent Due',
                event_date=due_date,
                description=desc
            )
            
            # Google Calendar
            push_event_to_google_calendar(title, due_date, desc)

@util.close_old_connections
def delete_old_job_executions(max_age=604_800):
    DjangoJobExecution.objects.delete_old_job_executions(max_age)

class Command(BaseCommand):
    help = "Runs APScheduler to generate vouchers and sync to Google Calendar."

    def handle(self, *args, **options):
        scheduler = BlockingScheduler(timezone=settings.TIME_ZONE)
        scheduler.add_jobstore(DjangoJobStore(), "default")

        # Run voucher generation every day at midnight (for prod). For testing, we can run it every 1 minute.
        # Let's run it every minute for demonstration purposes!
        scheduler.add_job(
            generate_vouchers_job,
            trigger=CronTrigger(minute="*/1"),  # Every 1 minute for testing
            id="generate_vouchers",
            max_instances=1,
            replace_existing=True,
        )
        logger.info("Added job 'generate_vouchers'.")

        # Cleanup old executions
        scheduler.add_job(
            delete_old_job_executions,
            trigger=CronTrigger(day_of_week="mon", hour="00", minute="00"),
            id="delete_old_job_executions",
            max_instances=1,
            replace_existing=True,
        )
        logger.info("Added weekly job: 'delete_old_job_executions'.")

        try:
            logger.info("Starting scheduler...")
            scheduler.start()
        except KeyboardInterrupt:
            logger.info("Stopping scheduler...")
            scheduler.shutdown()
            logger.info("Scheduler shut down successfully!")
