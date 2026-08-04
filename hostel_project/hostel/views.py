from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth import authenticate, login, update_session_auth_hash, logout
from django.contrib import messages
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.decorators import login_required
from django.db.models import Sum, Count
import csv
import os
from django.conf import settings
from django.http import FileResponse

from .models import (
    Complaint, Contact, Student,
    StudentDocument, HostelRoom, RoomInspection, Voucher, CalendarEvent, Visitor, SecurityDeposit
)
from .voucher_service import generate_monthly_vouchers, generate_voucher_pdf
from .calendar_service import GoogleCalendarSyncService


@login_required(login_url='login')
def student_dashboard(request):
    try:
        student = Student.objects.get(user=request.user)
    except Student.DoesNotExist:
        messages.error(request, "Session expired or profile missing. Please login again.")
        logout(request)
        return redirect('login')

    # Automated voucher generation is now triggered manually via API

    vouchers = Voucher.objects.filter(student=student).order_by('-due_date')[:5]
    documents = StudentDocument.objects.filter(student=student)
    inspections = RoomInspection.objects.filter(student=student).order_by('-inspection_date')
    calendar_events = CalendarEvent.objects.filter(student=student).order_by('event_date')[:5]

    context = {
        'student': student,
        'vouchers': vouchers,
        'documents': documents,
        'inspections': inspections,
        'calendar_events': calendar_events,
    }
    return render(request, 'student_dashboard.html', context)



@login_required(login_url='login')
def backup_database(request):
    if not request.user.is_superuser:
        raise Http404("Not authorized")
    db_path = settings.BASE_DIR / 'db.sqlite3'
    if os.path.exists(db_path):
        return FileResponse(open(db_path, 'rb'), as_attachment=True, filename='db_backup.sqlite3')
    else:
        raise Http404("Database file not found")

def student_login(request):
    if request.user.is_authenticated:
        return redirect('student_dashboard')

    if request.method == "POST":
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            messages.success(request, "Login Successful!")
            return redirect("student_dashboard")
        else:
            messages.error(request, "Invalid username or password")

    return render(request, "student_login.html")

def student_logout(request):
    logout(request)
    messages.success(request, "You have been logged out successfully.")
    return redirect('login')

@login_required(login_url='login')
def student_profile(request):
    try:
        student = Student.objects.get(user=request.user)
        documents = StudentDocument.objects.filter(student=student)
        return render(request, "student_profile.html", {'student': student, 'documents': documents})
    except Student.DoesNotExist:
        messages.error(request, "Session expired or profile missing. Please login again.")
        logout(request)
        return redirect('login')

def change_password(request):
    if request.method == "POST":
        form = PasswordChangeForm(user=request.user, data=request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)
            messages.success(request, "Your password was successfully updated.")
            return redirect('student_dashboard')
        else:
            messages.error(request, "Sorry, there was an error.")
    else:
        form = PasswordChangeForm(user=request.user)

    return render(request, 'change_password.html', {'form': form})


@login_required(login_url='login')
def room_info(request):
    return render(request, "room_info.html")

@login_required(login_url='login')
def complaint(request):
    if request.method == "POST":
        sub = request.POST.get("sub")
        msg = request.POST.get("msg")

        student = get_object_or_404(Student, user=request.user)

        complaint_obj = Complaint.objects.create(
            student=student,
            subject=sub,
            msg=msg,
        )

        # Log follow-up event in Calendar
        GoogleCalendarSyncService.create_event(
            title=f"Complaint Follow-up: {sub}",
            event_type="Complaint Follow-up",
            event_date=complaint_obj.date,
            student=student,
            description=msg
        )

        messages.success(request, "Your Complaint has been raised successfully.")
        return redirect("student_dashboard")
    return render(request, "complaint.html")

@login_required(login_url='login')
def complaint_history(request):
    student = get_object_or_404(Student, user=request.user)
    complaints = Complaint.objects.filter(student=student).order_by('-date')
    return render(request, 'complaint_history.html', {'complaints': complaints})


# --- 1. STUDENT DOCUMENT MANAGEMENT ---

@login_required(login_url='login')
def student_documents_view(request):
    if request.user.is_staff:
        documents = StudentDocument.objects.all().order_by('-uploaded_at')
    else:
        student = get_object_or_404(Student, user=request.user)
        documents = StudentDocument.objects.filter(student=student).order_by('-uploaded_at')
    return render(request, 'documents.html', {'documents': documents})

@login_required(login_url='login')
def upload_document_view(request):
    if request.method == "POST":
        doc_type = request.POST.get('doc_type')
        file_obj = request.FILES.get('file')
        expiry_date = request.POST.get('expiry_date') or None

        if request.user.is_staff:
            student_id = request.POST.get('student_id')
            student = get_object_or_404(Student, id=student_id)
        else:
            student = get_object_or_404(Student, user=request.user)

        if doc_type and file_obj:
            StudentDocument.objects.create(
                student=student,
                doc_type=doc_type,
                file=file_obj,
                expiry_date=expiry_date,
                verification_status='Pending'
            )
            messages.success(request, "Document uploaded successfully! Pending verification.")
        else:
            messages.error(request, "Please select document type and upload a valid file.")
    return redirect('student_documents')

@login_required(login_url='login')
def delete_document_view(request, doc_id):
    document = get_object_or_404(StudentDocument, id=doc_id)
    if request.user.is_staff or document.student.user == request.user:
        document.delete()
        messages.success(request, "Document removed successfully.")
    else:
        messages.error(request, "Permission denied.")
    return redirect('student_documents')


# --- 2. ROOM CONDITION INSPECTION MODULE ---

@login_required(login_url='login')
def room_inspection_view(request):
    if request.method == "POST" and request.user.is_staff:
        student_id = request.POST.get('student_id')
        student = get_object_or_404(Student, id=student_id)
        inspection_type = request.POST.get('inspection_type')
        room_number = request.POST.get('room_number', student.room_no)
        furniture = request.POST.get('furniture_condition', 'Good')
        wall = request.POST.get('wall_condition', 'Good')
        electrical = request.POST.get('electrical_condition', 'Good')
        bathroom = request.POST.get('bathroom_condition', 'Good')
        inventory = request.POST.get('inventory_checklist', 'Bed, Desk, Chair, Fan')
        damage_notes = request.POST.get('damage_notes', '')
        damage_charges = request.POST.get('damage_charges', 0.00)
        photo_1 = request.FILES.get('photo_1')
        photo_2 = request.FILES.get('photo_2')

        RoomInspection.objects.create(
            student=student,
            room_number=room_number,
            inspection_type=inspection_type,
            furniture_condition=furniture,
            wall_condition=wall,
            electrical_condition=electrical,
            bathroom_condition=bathroom,
            inventory_checklist=inventory,
            damage_notes=damage_notes,
            damage_charges=damage_charges,
            photo_1=photo_1,
            photo_2=photo_2
        )
        messages.success(request, f"Room {inspection_type} Inspection recorded successfully!")
        return redirect('room_inspections')

    if request.user.is_staff:
        inspections = RoomInspection.objects.all().order_by('-inspection_date')
        students = Student.objects.all()
    else:
        student = get_object_or_404(Student, user=request.user)
        inspections = RoomInspection.objects.filter(student=student).order_by('-inspection_date')
        students = [student]

    return render(request, 'room_inspection.html', {'inspections': inspections, 'students': students})


# --- 3. AUTOMATED 30-DAY MONTHLY PAYMENT VOUCHERS ---

@login_required(login_url='login')
def vouchers_view(request):
    if request.user.is_staff:
        vouchers = Voucher.objects.all().order_by('-due_date')
    else:
        student = get_object_or_404(Student, user=request.user)
        vouchers = Voucher.objects.filter(student=student).order_by('-due_date')
    return render(request, 'vouchers.html', {'vouchers': vouchers})

@login_required(login_url='login')
def download_voucher_pdf(request, voucher_id):
    voucher = get_object_or_404(Voucher, id=voucher_id)
    if not request.user.is_staff and voucher.student.user != request.user:
        raise Http404("Permission Denied")

    pdf_buffer = generate_voucher_pdf(voucher)
    response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Voucher_{voucher.voucher_no}.pdf"'
    return response


# --- 4. VISITORS MANAGEMENT ---

@login_required(login_url='login')
def visitors_view(request):
    if request.method == "POST":
        visitor_name = request.POST.get('visitor_name')
        phone = request.POST.get('phone')
        purpose = request.POST.get('purpose')
        photo = request.FILES.get('photo')

        if request.user.is_staff:
            student_id = request.POST.get('student_id')
            student = get_object_or_404(Student, id=student_id)
        else:
            student = get_object_or_404(Student, user=request.user)

        Visitor.objects.create(
            visitor_name=visitor_name,
            student=student,
            phone=phone,
            purpose=purpose,
            photo=photo
        )
        messages.success(request, "Visitor check-in registered successfully!")
        return redirect('visitors')

    if request.user.is_staff:
        visitors = Visitor.objects.all().order_by('-check_in')
        students = Student.objects.all()
    else:
        student = get_object_or_404(Student, user=request.user)
        visitors = Visitor.objects.filter(student=student).order_by('-check_in')
        students = [student]

    return render(request, 'visitors.html', {'visitors': visitors, 'students': students})


# --- 5. REPORTS & ANALYTICS DASHBOARD ---

@login_required(login_url='login')
def reports_dashboard_view(request):
    if not request.user.is_staff:
        messages.error(request, "Admin access required for Reports Dashboard.")
        return redirect('student_dashboard')

    total_students = Student.objects.count()
    total_rooms = HostelRoom.objects.count()
    vacant_rooms = HostelRoom.objects.filter(occupancy_status='Vacant').count()
    occupied_rooms = HostelRoom.objects.filter(occupancy_status='Occupied').count()

    total_vouchers = Voucher.objects.count()
    paid_vouchers = Voucher.objects.filter(status='Paid').count()
    unpaid_vouchers = Voucher.objects.filter(status='Unpaid').count()
    total_revenue = Voucher.objects.filter(status='Paid').aggregate(Sum('total_amount'))['total_amount__sum'] or 0.00
    pending_revenue = Voucher.objects.filter(status='Unpaid').aggregate(Sum('total_amount'))['total_amount__sum'] or 0.00

    total_inspections = RoomInspection.objects.count()
    total_damage_charges = RoomInspection.objects.aggregate(Sum('damage_charges'))['damage_charges__sum'] or 0.00

    total_complaints = Complaint.objects.count()
    pending_complaints = Complaint.objects.filter(status='Pending').count()

    context = {
        'total_students': total_students,
        'total_rooms': total_rooms,
        'vacant_rooms': vacant_rooms,
        'occupied_rooms': occupied_rooms,
        'total_vouchers': total_vouchers,
        'paid_vouchers': paid_vouchers,
        'unpaid_vouchers': unpaid_vouchers,
        'total_revenue': total_revenue,
        'pending_revenue': pending_revenue,
        'total_inspections': total_inspections,
        'total_damage_charges': total_damage_charges,
        'total_complaints': total_complaints,
        'pending_complaints': pending_complaints,
    }
    return render(request, 'reports.html', context)