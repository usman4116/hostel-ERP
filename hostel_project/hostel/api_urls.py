from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .api_views import (
    UserViewSet, StudentViewSet, StudentDocumentViewSet, 
    HostelRoomViewSet, RoomInspectionViewSet, VoucherViewSet, 
    CalendarEventViewSet, VisitorViewSet, SecurityDepositViewSet, 
    ComplaintViewSet, RentPaymentHistoryViewSet, ContactViewSet,
    StudentContractViewSet, LeaveNoticeViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'students', StudentViewSet, basename='student')
router.register(r'documents', StudentDocumentViewSet, basename='document')
router.register(r'rooms', HostelRoomViewSet, basename='room')
router.register(r'inspections', RoomInspectionViewSet, basename='inspection')
router.register(r'vouchers', VoucherViewSet, basename='voucher')
router.register(r'calendar', CalendarEventViewSet, basename='calendar')
router.register(r'visitors', VisitorViewSet, basename='visitor')
router.register(r'security-deposits', SecurityDepositViewSet, basename='securitydeposit')
router.register(r'complaints', ComplaintViewSet, basename='complaint')
router.register(r'rent-history', RentPaymentHistoryViewSet, basename='renthistory')
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'contracts', StudentContractViewSet, basename='contract')
router.register(r'leave-notices', LeaveNoticeViewSet, basename='leavenotice')

urlpatterns = [
    # JWT Auth Endpoints
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API Router URLs
    path('', include(router.urls)),
]
