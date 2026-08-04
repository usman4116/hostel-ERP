from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
import csv
from django.urls import path
from django.shortcuts import redirect
from django.contrib import messages
from django.http import HttpResponse
from .models import (
    HostelRoom, Student, StudentDocument, RoomInspection, 
    Voucher, CalendarEvent, Visitor, SecurityDeposit, 
    Complaint, RentPaymentHistory, Contact, CompanySettings,
    StudentContract, LeaveNotice
)
from .voucher_service import generate_monthly_vouchers

@admin.register(CompanySettings)
class CompanySettingsAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'contact_number', 'ac_unit_rate')
    fieldsets = (
        ('General Info', {
            'fields': ('name', 'address', 'contact_number', 'email', 'logo')
        }),
        ('Billing Settings', {
            'fields': ('ac_unit_rate',)
        }),
    )

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('enrollment_no', 'name', 'cnic', 'room_no', 'phone', 'email', 'colored_rent_status', 'join_date')
    list_filter = ('rent_status', 'gender', 'join_date')
    search_fields = ('enrollment_no', 'name', 'room_no', 'email', 'phone')
    ordering = ('room_no', 'name')
    readonly_fields = ('enrollment_no',)
    actions = ['export_as_csv']

    def colored_rent_status(self, obj):
        if obj.rent_status:
            return mark_safe('<span style="background-color: #28a745; color: white; padding: 4px 10px; border-radius: 12px; font-weight: bold;">Paid</span>')
        return mark_safe('<span style="background-color: #dc3545; color: white; padding: 4px 10px; border-radius: 12px; font-weight: bold;">Unpaid</span>')
    colored_rent_status.short_description = "Rent Status"
    colored_rent_status.admin_order_field = "rent_status"

    def export_as_csv(self, request, queryset):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename=students.csv'
        writer = csv.writer(response)
        writer.writerow(['Enrollment No', 'Name', 'Room No', 'Mobile', 'Email', 'Gender', 'Address', 'Join Date'])
        
        for student in queryset:
            writer.writerow([
                student.enrollment_no,
                student.name, 
                student.room_no, 
                student.phone, 
                student.email, 
                student.gender, 
                student.address, 
                student.join_date
            ])

        return response

    export_as_csv.short_description = "Export Selected Students to CSV"


@admin.register(StudentContract)
class StudentContractAdmin(admin.ModelAdmin):
    list_display = ('student', 'is_signed', 'signed_at', 'created_at')
    list_filter = ('is_signed', 'created_at')
    search_fields = ('student__name', 'student__enrollment_no')
    readonly_fields = ('is_signed', 'signed_at', 'signature_text', 'created_at', 'updated_at')

@admin.register(LeaveNotice)
class LeaveNoticeAdmin(admin.ModelAdmin):
    list_display = ('student', 'notice_date', 'planned_leaving_date', 'eligible_for_refund', 'status')
    list_filter = ('status', 'notice_date')
    search_fields = ('student__name', 'student__enrollment_no')
    readonly_fields = ('notice_date', 'eligible_for_refund', 'created_at')

@admin.register(StudentDocument)
class StudentDocumentAdmin(admin.ModelAdmin):
    list_display = ('student', 'doc_type', 'verification_status', 'uploaded_at', 'view_file_link')
    list_filter = ('doc_type', 'verification_status', 'uploaded_at')
    search_fields = ('student__name', 'student__enrollment_no', 'doc_type')
    list_editable = ('verification_status',)

    def view_file_link(self, obj):
        if obj.file:
            return format_html('<a href="{}" target="_blank" class="btn btn-sm btn-primary">📄 View File</a>', obj.file.url)
        return "-"
    view_file_link.short_description = "Document Link"


@admin.register(HostelRoom)
class HostelRoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'building_name', 'floor', 'capacity', 'monthly_rent', 'has_ac', 'occupancy_badge')
    list_filter = ('occupancy_status', 'building_name', 'floor', 'has_ac')
    search_fields = ('room_number', 'building_name')

    def occupancy_badge(self, obj):
        if obj.occupancy_status == 'Vacant':
            return mark_safe('<span style="background-color: #28a745; color: white; padding: 4px 8px; border-radius: 10px;">Vacant</span>')
        elif obj.occupancy_status == 'Occupied':
            return mark_safe('<span style="background-color: #0d6efd; color: white; padding: 4px 8px; border-radius: 10px;">Occupied</span>')
        return mark_safe('<span style="background-color: #fd7e14; color: white; padding: 4px 8px; border-radius: 10px;">Maintenance</span>')
    occupancy_badge.short_description = "Occupancy"
    occupancy_badge.admin_order_field = "occupancy_status"


@admin.register(RoomInspection)
class RoomInspectionAdmin(admin.ModelAdmin):
    list_display = ('student', 'room_number', 'inspection_type', 'inspection_date', 'damage_charges', 'photo_preview')
    list_filter = ('inspection_type', 'inspection_date')
    search_fields = ('student__name', 'room_number', 'damage_notes')

    def photo_preview(self, obj):
        if obj.photo_1:
            return format_html('<img src="{}" style="width: 50px; height: 50px; border-radius: 6px; object-fit: cover;" />', obj.photo_1.url)
        return "No Photo"
    photo_preview.short_description = "Photo"


@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    change_list_template = "admin/voucher_changelist.html"
    
    list_display = ('voucher_no', 'student', 'billing_cycle_start', 'due_date', 'total_amount', 'is_ac_room', 'status', 'download_pdf_button')
    list_filter = ('status', 'due_date', 'is_ac_room')
    search_fields = ('voucher_no', 'student__name', 'student__enrollment_no')
    readonly_fields = ('voucher_no', 'total_amount')
    list_editable = ('status',)

    def download_pdf_button(self, obj):
        return format_html('<a href="/api/v1/vouchers/{}/pdf/" target="_blank" class="btn btn-sm btn-info">PDF</a>', obj.id)
    download_pdf_button.short_description = "Download"
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('generate-batch/', self.admin_site.admin_view(self.generate_batch), name="generate-batch-vouchers"),
        ]
        return custom_urls + urls

    def generate_batch(self, request):
        try:
            created = generate_monthly_vouchers()
            if created:
                self.message_user(request, f"Successfully generated {len(created)} vouchers for active students.", messages.SUCCESS)
            else:
                self.message_user(request, "No new vouchers needed. All active students already have a voucher for this month.", messages.INFO)
        except Exception as e:
            self.message_user(request, f"Error generating vouchers: {str(e)}", messages.ERROR)
            
        return redirect("..")


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_type', 'event_date', 'student', 'reminder_sent')
    list_filter = ('event_type', 'event_date', 'reminder_sent')
    search_fields = ('title', 'student__name', 'description')


@admin.register(Visitor)
class VisitorAdmin(admin.ModelAdmin):
    list_display = ('visitor_name', 'student', 'phone', 'purpose', 'check_in', 'check_out')
    list_filter = ('check_in',)
    search_fields = ('visitor_name', 'student__name', 'phone', 'purpose')


@admin.register(SecurityDeposit)
class SecurityDepositAdmin(admin.ModelAdmin):
    list_display = ('student', 'deposit_received', 'damage_deduction', 'refund_amount', 'status', 'download_pdf_button')
    list_filter = ('status',)
    search_fields = ('student__name',)

    def download_pdf_button(self, obj):
        return format_html(
            '<a href="/api/v1/security-deposits/{}/pdf/" target="_blank" class="btn btn-primary btn-sm" style="background-color:#3b82f6; color:white; border-radius:6px; padding:4px 12px; text-decoration:none;"><i class="fas fa-file-pdf"></i> Download PDF</a>',
            obj.id
        )
    download_pdf_button.short_description = "PDF Receipt"


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'date', 'status', 'response')
    list_filter = ('status', 'date')
    search_fields = ('student__name', 'subject', 'msg')
    list_editable = ('status', 'response')


@admin.register(RentPaymentHistory)
class RentPaymentHistoryAdmin(admin.ModelAdmin):
    list_display = ('student', 'month', 'amount', 'amount_paid', 'remaining_amount', 'status', 'date_paid')
    list_filter = ('status', 'month', 'date_paid')
    search_fields = ('student__name', 'month')



@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'mobile_number', 'visitor_email', 'contact_date')
    list_filter = ('contact_date',)
    search_fields = ('name', 'visitor_email', 'mobile_number', 'msg')