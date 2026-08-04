from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from hostel.models import Student, HostelRoom, CompanySettings
import random
from datetime import date

class Command(BaseCommand):
    help = 'Generates demo data for the hostel application'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting demo data generation...")

        # 1. Create Superuser (admin / admin)
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'admin')
            self.stdout.write(self.style.SUCCESS("Created superuser 'admin' with password 'admin'"))
        else:
            self.stdout.write("Superuser 'admin' already exists.")

        # 2. Create Company Settings
        if not CompanySettings.objects.exists():
            CompanySettings.objects.create(
                name="Grand Hostel",
                address="123 University Road",
                contact_number="555-0199",
                email="info@grandhostel.com",
                ac_unit_rate=25.50
            )
            self.stdout.write(self.style.SUCCESS("Created Company Settings"))

        # 3. Create Rooms
        rooms_data = [
            ("A Block", 1, "101", 2, "Vacant", 3000, 5000, True),
            ("A Block", 1, "102", 3, "Vacant", 2500, 4000, False),
            ("A Block", 2, "201", 1, "Vacant", 5000, 8000, True),
            ("B Block", 1, "105", 2, "Vacant", 3000, 5000, False),
            ("B Block", 2, "205", 4, "Vacant", 2000, 3000, True),
        ]

        for building, floor, room_no, cap, status, rent, sec, ac in rooms_data:
            HostelRoom.objects.get_or_create(
                room_number=room_no,
                defaults={
                    "building_name": building,
                    "floor": floor,
                    "capacity": cap,
                    "occupancy_status": status,
                    "monthly_rent": rent,
                    "security_deposit": sec,
                    "has_ac": ac
                }
            )
        self.stdout.write(self.style.SUCCESS(f"Created {len(rooms_data)} demo rooms."))

        # 4. Create Students
        students_data = [
            ("Ali Khan", "ali", "ali@example.com", "03001234567", "Male", "Lahore", "101", True),
            ("Ahmed Ali", "ahmed", "ahmed@example.com", "03007654321", "Male", "Karachi", "101", True),
            ("Sara Ahmed", "sara", "sara@example.com", "03009998887", "Female", "Islamabad", "102", False),
        ]

        for name, username, email, phone, gender, address, room_no, rent_status in students_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={"email": email}
            )
            if created:
                user.set_password('password123')
                user.save()

            Student.objects.get_or_create(
                user=user,
                defaults={
                    "name": name,
                    "email": email,
                    "phone": phone,
                    "gender": gender,
                    "address": address,
                    "room_no": room_no,
                    "rent_status": rent_status,
                }
            )
            # Update room occupancy
            room = HostelRoom.objects.filter(room_number=room_no).first()
            if room:
                room.occupancy_status = "Occupied"
                room.save()

        self.stdout.write(self.style.SUCCESS(f"Created {len(students_data)} demo students."))
        self.stdout.write(self.style.SUCCESS("Demo data generation complete!"))
