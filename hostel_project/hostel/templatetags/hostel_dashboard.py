from django import template
from django.db.models import Sum
from hostel.models import HostelRoom, Voucher

register = template.Library()

@register.inclusion_tag('admin/dashboard_charts.html')
def render_admin_charts():
    total_rooms = HostelRoom.objects.count()
    vacant_rooms = HostelRoom.objects.filter(occupancy_status='Vacant').count()
    occupied_rooms = HostelRoom.objects.filter(occupancy_status='Occupied').count()

    total_vouchers = Voucher.objects.count()
    paid_vouchers = Voucher.objects.filter(status='Paid').count()
    unpaid_vouchers = Voucher.objects.filter(status='Unpaid').count()

    total_revenue = Voucher.objects.filter(status='Paid').aggregate(Sum('total_amount'))['total_amount__sum'] or 0.00
    pending_revenue = Voucher.objects.filter(status='Unpaid').aggregate(Sum('total_amount'))['total_amount__sum'] or 0.00

    return {
        'total_rooms': total_rooms,
        'vacant_rooms': vacant_rooms,
        'occupied_rooms': occupied_rooms,
        'total_vouchers': total_vouchers,
        'paid_vouchers': paid_vouchers,
        'unpaid_vouchers': unpaid_vouchers,
        'total_revenue': total_revenue,
        'pending_revenue': pending_revenue,
    }
