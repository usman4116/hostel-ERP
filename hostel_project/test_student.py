import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hostel_project.settings")
django.setup()

from hostel.serializers import StudentSerializer

data = {
    "phone_no": "12345",
    "gender": "Male",
    "address": "Test",
    "rent_price": 0,
    "rent_status": False,
    "user_id": 1,
    "room_no": None,
    "assigned_warden": None
}

s = StudentSerializer(data=data)
print(s.is_valid())
print(s.errors)
