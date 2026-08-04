from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.http import HttpResponse
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
import os
from django.conf import settings
from .models import (
    Student, StudentDocument, HostelRoom, RoomInspection, 
    Voucher, CalendarEvent, Visitor, SecurityDeposit, 
    Complaint, RentPaymentHistory, Contact, CompanySettings,
    StudentContract, LeaveNotice
)
from .serializers import (
    UserSerializer, StudentSerializer, StudentDocumentSerializer, 
    HostelRoomSerializer, RoomInspectionSerializer, VoucherSerializer, 
    CalendarEventSerializer, VisitorSerializer, SecurityDepositSerializer, 
    ComplaintSerializer, RentPaymentHistorySerializer, ContactSerializer,
    StudentContractSerializer, LeaveNoticeSerializer
)
from .voucher_service import generate_monthly_vouchers, generate_voucher_pdf

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Student.objects.all()
        return Student.objects.filter(user=self.request.user)

class StudentDocumentViewSet(viewsets.ModelViewSet):
    queryset = StudentDocument.objects.all()
    serializer_class = StudentDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

class HostelRoomViewSet(viewsets.ModelViewSet):
    queryset = HostelRoom.objects.all()
    serializer_class = HostelRoomSerializer
    # Public can view rooms, only admin can edit
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class RoomInspectionViewSet(viewsets.ModelViewSet):
    queryset = RoomInspection.objects.all()
    serializer_class = RoomInspectionSerializer
    permission_classes = [permissions.IsAdminUser]

class VoucherViewSet(viewsets.ModelViewSet):
    queryset = Voucher.objects.all()
    serializer_class = VoucherSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Voucher.objects.all()
        # Ensure student only sees their own vouchers
        try:
            student = Student.objects.get(user=self.request.user)
            return Voucher.objects.filter(student=student)
        except Student.DoesNotExist:
            return Voucher.objects.none()
            
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def generate_batch(self, request):
        try:
            created_vouchers = generate_monthly_vouchers()
            return Response({
                "status": "success",
                "message": f"Successfully generated {len(created_vouchers)} new vouchers for active students.",
                "count": len(created_vouchers)
            })
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=400)
            
    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        voucher = self.get_object()
        
        # Use our beautiful new invoice generator
        buffer = generate_voucher_pdf(voucher)
        pdf_data = buffer.getvalue()
        buffer.close()
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="voucher_{voucher.voucher_no}.pdf"'
        response.write(pdf_data)
        return response

class CalendarEventViewSet(viewsets.ModelViewSet):
    queryset = CalendarEvent.objects.all()
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated]

class VisitorViewSet(viewsets.ModelViewSet):
    queryset = Visitor.objects.all()
    serializer_class = VisitorSerializer
    permission_classes = [permissions.IsAuthenticated]

class SecurityDepositViewSet(viewsets.ModelViewSet):
    queryset = SecurityDeposit.objects.all()
    serializer_class = SecurityDepositSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        deposit = self.get_object()
        company = CompanySettings.objects.first()
        
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        # Company Header
        if company:
            if company.logo and os.path.exists(company.logo.path):
                img = ImageReader(company.logo.path)
                p.drawImage(img, 50, 710, width=80, height=80, preserveAspectRatio=True, mask='auto')
            
            p.setFont("Helvetica-Bold", 24)
            p.drawString(150, 760, company.name)
            
            p.setFont("Helvetica", 10)
            if company.address:
                p.drawString(150, 740, company.address)
            if company.contact_number:
                p.drawString(150, 725, f"Phone: {company.contact_number}")
            if company.email:
                p.drawString(150, 710, f"Email: {company.email}")
                
        p.line(50, 690, 550, 690)
        
        p.setFont("Helvetica-Bold", 18)
        p.drawString(180, 650, "SECURITY DEPOSIT RECEIPT")
        
        p.setFont("Helvetica", 12)
        p.drawString(50, 610, f"Student: {deposit.student.name} ({deposit.student.enrollment_no})")
        p.drawString(50, 590, f"Room Number: {deposit.student.room_no}")
        
        p.drawString(50, 550, f"Deposit Amount: PKR {deposit.deposit_received}")
        p.drawString(50, 530, f"Damage Deduction: PKR {deposit.damage_deduction}")
        p.drawString(50, 510, f"Refund Amount: PKR {deposit.refund_amount}")
        p.drawString(50, 490, f"Status: {deposit.status}")
        
        p.showPage()
        p.save()
        
        pdf = buffer.getvalue()
        buffer.close()
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="security_deposit_{deposit.id}.pdf"'
        response.write(pdf)
        return response

class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Complaint.objects.all()
        try:
            student = Student.objects.get(user=self.request.user)
            return Complaint.objects.filter(student=student)
        except Student.DoesNotExist:
            return Complaint.objects.none()

class RentPaymentHistoryViewSet(viewsets.ModelViewSet):
    queryset = RentPaymentHistory.objects.all()
    serializer_class = RentPaymentHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return RentPaymentHistory.objects.all()
        try:
            student = Student.objects.get(user=self.request.user)
            return RentPaymentHistory.objects.filter(student=student)
        except Student.DoesNotExist:
            return RentPaymentHistory.objects.none()

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [permissions.AllowAny]

from django.utils import timezone

class StudentContractViewSet(viewsets.ModelViewSet):
    queryset = StudentContract.objects.all()
    serializer_class = StudentContractSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return StudentContract.objects.all().order_by('-created_at')
        
        try:
            student = Student.objects.get(user=self.request.user)
            return StudentContract.objects.filter(student=student)
        except Student.DoesNotExist:
            return StudentContract.objects.none()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def sign(self, request, pk=None):
        contract = self.get_object()
        
        # Verify it's the student signing their own contract
        if not request.user.is_staff:
            if contract.student.user != request.user:
                return Response({"error": "You are not authorized to sign this contract."}, status=403)
                
        if contract.is_signed:
            return Response({"error": "Contract is already signed."}, status=400)
            
        signature_text = request.data.get('signature_text', '').strip()
        if not signature_text:
            return Response({"error": "Signature text is required."}, status=400)
            
        contract.is_signed = True
        contract.signature_text = signature_text
        contract.signed_at = timezone.now()
        contract.save()
        
        return Response({
            "status": "success", 
            "message": "Contract successfully signed.",
            "data": StudentContractSerializer(contract).data
        })

class LeaveNoticeViewSet(viewsets.ModelViewSet):
    queryset = LeaveNotice.objects.all()
    serializer_class = LeaveNoticeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return LeaveNotice.objects.all().order_by('-created_at')
        try:
            student = Student.objects.get(user=self.request.user)
            return LeaveNotice.objects.filter(student=student)
        except Student.DoesNotExist:
            return LeaveNotice.objects.none()
