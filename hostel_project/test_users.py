import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hostel_project.settings")
django.setup()

from hostel.models import User, Student

users = User.objects.all()
print(f"Total users: {users.count()}")
for u in users:
    has_student = Student.objects.filter(user=u).exists()
    print(f"User: {u.username}, is_staff: {u.is_staff}, has_student_profile: {has_student}")
