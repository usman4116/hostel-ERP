from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Student, StudentDocument, HostelRoom, RoomInspection, 
    Voucher, CalendarEvent, Visitor, SecurityDeposit, 
    Complaint, RentPaymentHistory, Contact, CompanySettings,
    StudentContract, LeaveNotice
)

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    student_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'password', 'student_profile']

    def get_student_profile(self, obj):
        try:
            return {'id': obj.student.id, 'name': obj.student.name, 'room_no': obj.student.room_no}
        except:
            return None

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )
    
    class Meta:
        model = Student
        fields = '__all__'

class StudentDocumentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_enrollment_no = serializers.CharField(source='student.enrollment_no', read_only=True)
    student_room_no = serializers.CharField(source='student.room_no', read_only=True)

    class Meta:
        model = StudentDocument
        fields = '__all__'

class HostelRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = HostelRoom
        fields = '__all__'

class RoomInspectionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_enrollment_no = serializers.CharField(source='student.enrollment_no', read_only=True)

    class Meta:
        model = RoomInspection
        fields = '__all__'

class VoucherSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_enrollment_no = serializers.CharField(source='student.enrollment_no', read_only=True)
    student_room_no = serializers.CharField(source='student.room_no', read_only=True)
    ac_unit_rate = serializers.SerializerMethodField()

    class Meta:
        model = Voucher
        fields = '__all__'
        
    def get_ac_unit_rate(self, obj):
        company = CompanySettings.objects.first()
        if company:
            return company.ac_unit_rate
        return 0.00

class CalendarEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarEvent
        fields = '__all__'

class VisitorSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_enrollment_no = serializers.CharField(source='student.enrollment_no', read_only=True)

    class Meta:
        model = Visitor
        fields = '__all__'

class SecurityDepositSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_enrollment_no = serializers.CharField(source='student.enrollment_no', read_only=True)

    class Meta:
        model = SecurityDeposit
        fields = '__all__'

class ComplaintSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_enrollment_no = serializers.CharField(source='student.enrollment_no', read_only=True)

    class Meta:
        model = Complaint
        fields = '__all__'

class RentPaymentHistorySerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_enrollment_no = serializers.CharField(source='student.enrollment_no', read_only=True)

    class Meta:
        model = RentPaymentHistory
        fields = '__all__'

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'

class CompanySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanySettings
        fields = ['name', 'address', 'contact_number', 'email', 'logo', 'ac_unit_rate']

class StudentContractSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_cnic = serializers.CharField(source='student.cnic', read_only=True)
    student_enrollment_no = serializers.CharField(source='student.enrollment_no', read_only=True)
    company_settings = serializers.SerializerMethodField()

    class Meta:
        model = StudentContract
        fields = '__all__'

    def get_company_settings(self, obj):
        company = CompanySettings.objects.first()
        if company:
            return CompanySettingsSerializer(company).data
        return None

class LeaveNoticeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_enrollment_no = serializers.CharField(source='student.enrollment_no', read_only=True)
    eligible_for_refund = serializers.BooleanField(read_only=True)

    class Meta:
        model = LeaveNotice
        fields = '__all__'
