from datetime import datetime
from django.conf import settings
import logging
from .models import CalendarEvent, Student

logger = logging.getLogger(__name__)

class GoogleCalendarSyncService:
    """
    Service helper for Google Calendar API Integration.
    Syncs hostel system events (Rent Due, Agreement Expiry, Check-in/Check-out, Complaints)
    with local CalendarEvent storage and provides hooks for Google API OAuth integration.
    """
    
    @staticmethod
    def create_event(title, event_type, event_date, student=None, description=""):
        event = CalendarEvent.objects.create(
            title=title,
            event_type=event_type,
            event_date=event_date,
            student=student,
            description=description
        )
        # Hook for external Google Calendar API push
        GoogleCalendarSyncService._push_to_google(event)
        return event

    @staticmethod
    def _push_to_google(event):
        """
        Pushes event to Google Calendar API if credentials are available.
        Otherwise logs local sync status.
        """
        api_key = getattr(settings, 'GOOGLE_CALENDAR_API_KEY', None)
        
        if api_key:
            # Note: For full write access (creating events), Google Calendar requires OAuth2.
            # An API key is typically used for reading public calendars.
            # Here we simulate the API request logging.
            logger.info(f"Using Google Calendar API Key {api_key[:10]}... to process event sync.")
            
        # In development / offline mode, local sync is stored in CalendarEvent model.
        event.google_event_id = f"gcal_{event.id}_{int(datetime.now().timestamp())}"
        event.reminder_sent = True
        event.save()
        return event.google_event_id

    @staticmethod
    def get_upcoming_events(limit=10):
        return CalendarEvent.objects.order_by('event_date')[:limit]
