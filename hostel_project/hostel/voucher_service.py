import calendar
from datetime import timedelta, date
from decimal import Decimal
import io
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from .models import Student, Voucher, CalendarEvent

def generate_monthly_vouchers():
    """
    Manual batch generation: Generates a single voucher for the current calendar month
    for all active students (where leaving_date is null). Prevents duplicates.
    """
    today = date.today()
    created_vouchers = []
    
    # Define the billing cycle as the current calendar month
    _, last_day = calendar.monthrange(today.year, today.month)
    cycle_start = date(today.year, today.month, 1)
    cycle_end = date(today.year, today.month, last_day)
    # Due on the 10th of the month
    due_date = date(today.year, today.month, 10)

    # Get active students (no leaving date set)
    active_students = Student.objects.filter(leaving_date__isnull=True)

    for student in active_students:
        voucher_no = f"VCH-{student.id}-{cycle_start.strftime('%Y%m')}"

        if not Voucher.objects.filter(voucher_no=voucher_no).exists():
            rent_val = Decimal(student.rent_price) if student.rent_price else Decimal('3000.00')
            
            is_ac = False
            initial_reading = None
            
            # Check if student is assigned to an AC room
            try:
                from .models import HostelRoom
                room = HostelRoom.objects.filter(room_number=student.room_no).first()
                if room and room.has_ac:
                    is_ac = True
                    # Look up previous voucher to get initial reading
                    prev_voucher = Voucher.objects.filter(student=student, is_ac_room=True).order_by('-created_at').first()
                    if prev_voucher and prev_voucher.final_meter_reading is not None:
                        initial_reading = prev_voucher.final_meter_reading
                    else:
                        initial_reading = 0
            except Exception:
                pass

            voucher = Voucher.objects.create(
                voucher_no=voucher_no,
                student=student,
                enrollment_date=student.join_date or today,
                billing_cycle_start=cycle_start,
                billing_cycle_end=cycle_end,
                due_date=due_date,
                rent_amount=rent_val,
                electricity_charges=Decimal('0.00'),
                other_charges=Decimal('0.00'),
                is_ac_room=is_ac,
                initial_meter_reading=initial_reading,
                status='Unpaid'
            )
            created_vouchers.append(voucher)

            # Auto-create Calendar Event for Rent Due Date
            CalendarEvent.objects.get_or_create(
                student=student,
                title=f"Rent Due: {cycle_start.strftime('%B %Y')}",
                event_type="Rent Due",
                event_date=due_date,
                defaults={"description": f"Monthly hostel rent voucher due for {student.name}"}
            )

    return created_vouchers


def generate_voucher_pdf(voucher):
    """
    Generates a PDF buffer for a Voucher using ReportLab in a professional Invoice format.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle('DocTitle', parent=styles['Heading1'], fontSize=26, leading=30, textColor=colors.HexColor('#1e2130'), alignment=0, fontName='Helvetica-Bold')
    invoice_title_style = ParagraphStyle('InvoiceTitle', parent=styles['Heading1'], fontSize=32, leading=36, textColor=colors.HexColor('#0d6efd'), alignment=2, fontName='Helvetica-Bold')
    subtitle_style = ParagraphStyle('DocSubtitle', parent=styles['Normal'], fontSize=11, leading=16, textColor=colors.gray, alignment=0)
    normal_bold = ParagraphStyle('NormalBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=14)
    normal_right = ParagraphStyle('NormalRight', parent=styles['Normal'], alignment=2, fontSize=10, leading=14)
    
    elements = []

    # Header Row (Company Info Left, INVOICE Right)
    header_data = [
        [
            Paragraph("<b>OpenERP</b>", title_style),
            Paragraph("<b>INVOICE</b>", invoice_title_style)
        ],
        [
            Paragraph("123 University Road<br/>City, State, 12345<br/>Phone: (555) 123-4567<br/>Email: billing@openerp.com", subtitle_style),
            Paragraph(f"<b>Voucher #:</b> {voucher.voucher_no}<br/><b>Issue Date:</b> {voucher.created_at.strftime('%B %d, %Y')}<br/><b>Due Date:</b> <font color='red'><b>{voucher.due_date.strftime('%B %d, %Y')}</b></font>", normal_right)
        ]
    ]
    header_table = Table(header_data, colWidths=[260, 260])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 20))

    # Bill To Section
    bill_to_data = [
        [Paragraph("<b>BILL TO:</b>", normal_bold)],
        [Paragraph(f"<b>{voucher.student.name}</b><br/>Enrollment #: {voucher.student.enrollment_no}<br/>Room: {voucher.student.room_no}<br/>Phone: {voucher.student.phone or 'N/A'}", styles['Normal'])]
    ]
    bill_to_table = Table(bill_to_data, colWidths=[520])
    bill_to_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f8f9fa')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#dee2e6')),
    ]))
    elements.append(bill_to_table)
    elements.append(Spacer(1, 25))

    # Invoice Details Table
    table_data = [
        [
            Paragraph("<b>Description</b>", normal_bold), 
            Paragraph("<b>Billing Period</b>", normal_bold), 
            Paragraph("<b>Amount (PKR)</b>", normal_bold)
        ],
        [
            Paragraph("Monthly Room Rent", styles['Normal']), 
            Paragraph(f"{voucher.billing_cycle_start.strftime('%b %d')} - {voucher.billing_cycle_end.strftime('%b %d, %Y')}", styles['Normal']),
            Paragraph(f"{voucher.rent_amount:,.2f}", normal_right)
        ],
        [
            Paragraph("Electricity & Utility Charges", styles['Normal']), 
            Paragraph("-", styles['Normal']),
            Paragraph(f"{voucher.electricity_charges:,.2f}", normal_right)
        ],
        [
            Paragraph("Maintenance & Other Charges", styles['Normal']), 
            Paragraph("-", styles['Normal']),
            Paragraph(f"{voucher.other_charges:,.2f}", normal_right)
        ],
        [
            Paragraph("", styles['Normal']),
            Paragraph("<b>TOTAL PAYABLE:</b>", normal_bold), 
            Paragraph(f"<b>{voucher.total_amount:,.2f}</b>", normal_right)
        ]
    ]

    t_charges = Table(table_data, colWidths=[240, 150, 130])
    t_charges.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0d6efd')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -2), 1, colors.HexColor('#e9ecef')),
        ('BOX', (0, 0), (-1, -2), 1, colors.HexColor('#dee2e6')),
        ('BACKGROUND', (1, -1), (-1, -1), colors.HexColor('#f8f9fa')),
        ('BOX', (1, -1), (-1, -1), 1, colors.HexColor('#dee2e6')),
        ('TOPPADDING', (0, 1), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 10),
    ]))
    elements.append(t_charges)
    elements.append(Spacer(1, 40))

    # Footer Notes
    notes_data = [
        [Paragraph("<b>Payment Instructions:</b>", normal_bold)],
        [Paragraph("1. Please pay the total amount on or before the due date to avoid late payment surcharges.<br/>2. Payment can be submitted at the hostel management accounts desk or via online bank transfer.<br/>3. Keep this invoice for your records.", styles['Normal'])],
        [Spacer(1, 40)],
        [Paragraph("_________________________<br/>Authorized Signature", normal_right)]
    ]
    t_notes = Table(notes_data, colWidths=[520])
    t_notes.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(t_notes)

    # Status Stamp
    if voucher.status.lower() == 'paid':
        stamp = Paragraph("<font color='green'><b>PAID IN FULL</b></font>", ParagraphStyle('paid', parent=styles['Heading2'], alignment=1))
        elements.append(Spacer(1, 20))
        elements.append(stamp)

    doc.build(elements)
    buffer.seek(0)
    return buffer
