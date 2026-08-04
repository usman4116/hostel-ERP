import os
import django
import random
from datetime import date, timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hostel_project.settings")
django.setup()

from django.contrib.auth.models import User
from hostel.models import HostelRoom, Student, CompanySettings

def populate():
    # 1. Ensure Company Settings exist
    company, created = CompanySettings.objects.get_or_create(
        id=1,
        defaults={
            'name': 'OpenERP Hostel',
            'address': '123 Main Street',
            'contact_number': '+92-300-1234567',
            'email': 'admin@openerphostel.com',
            'ac_unit_rate': 45.00
        }
    )

    # 2. Create Rooms
    room_data = [
        {'room_number': '101', 'capacity': 2, 'has_ac': True, 'monthly_rent': 8000},
        {'room_number': '102', 'capacity': 2, 'has_ac': True, 'monthly_rent': 8000},
        {'room_number': '103', 'capacity': 3, 'has_ac': False, 'monthly_rent': 4000},
        {'room_number': '201', 'capacity': 2, 'has_ac': False, 'monthly_rent': 5000},
        {'room_number': '202', 'capacity': 1, 'has_ac': True, 'monthly_rent': 12000},
        {'room_number': '203', 'capacity': 4, 'has_ac': False, 'monthly_rent': 3000},
    ]

    rooms = []
    for data in room_data:
        room, _ = HostelRoom.objects.get_or_create(
            room_number=data['room_number'],
            defaults={
                'building_name': 'Block A',
                'floor': int(data['room_number'][0]),
                'capacity': data['capacity'],
                'occupancy_status': 'Vacant',
                'monthly_rent': data['monthly_rent'],
                'security_deposit': 5000.00,
                'has_ac': data['has_ac']
            }
        )
        rooms.append(room)

    # 3. Create Students
    student_data = [
        {'name': 'Ali Khan', 'email': 'ali@demo.com', 'room': rooms[0]},
        {'name': 'Bilal Ahmed', 'email': 'bilal@demo.com', 'room': rooms[0]},
        {'name': 'Zain Malik', 'email': 'zain@demo.com', 'room': rooms[2]},
        {'name': 'Usman Farhan', 'email': 'usman@demo.com', 'room': rooms[3]},
        {'name': 'Saad Tariq', 'email': 'saad@demo.com', 'room': rooms[4]},
    ]

    for data in student_data:
        # Create User
        username = data['email'].split('@')[0]
        if not User.objects.filter(username=username).exists():
            user = User.objects.create_user(
                username=username,
                email=data['email'],
                password='password123',
                first_name=data['name'].split()[0],
                last_name=data['name'].split()[-1] if len(data['name'].split()) > 1 else ''
            )
            
            # Create Student
            Student.objects.create(
                user=user,
                name=data['name'],
                email=data['email'],
                phone=f'0300{random.randint(1000000, 9999999)}',
                gender='Male',
                address='Dummy Address, City',
                room_no=data['room'].room_number,
                rent_price=str(data['room'].monthly_rent),
                deposit_amount=5000.00,
            )

    # Update room occupancy
    for room in rooms:
        count = Student.objects.filter(room_no=room.room_number).count()
        if count >= room.capacity:
            room.occupancy_status = 'Occupied'
            room.save()
        elif count > 0:
            room.occupancy_status = 'Occupied' # Mark occupied even if partially filled for demo
            room.save()

    print("Demo data added successfully!")
    print(f"Added {len(room_data)} rooms and {len(student_data)} students.")

if __name__ == '__main__':
    populate()
