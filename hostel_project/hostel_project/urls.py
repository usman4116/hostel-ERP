from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from hostel import views

urlpatterns = [
    path('superadmin/', admin.site.urls),
    path('', views.student_login, name='home'),
    path('login/', views.student_login, name='login'),
    path('logout/', views.student_logout, name='logout'),
    path('student_dashboard', views.student_dashboard, name='student_dashboard'),
    path('student_profile', views.student_profile, name='student_profile'),
    path('change_password/', views.change_password, name='change_password'),
    path('backup/', views.backup_database, name='backup_database'),

    path('room_info/', views.room_info, name='room_info'),
    path('complaint/', views.complaint, name="complaint"),
    path('complaint_history/', views.complaint_history, name="complaint_history"),
    
    # New Modules Routes
    path('documents/', views.student_documents_view, name='student_documents'),
    path('documents/upload/', views.upload_document_view, name='upload_document'),
    path('documents/delete/<int:doc_id>/', views.delete_document_view, name='delete_document'),
    path('room_inspections/', views.room_inspection_view, name='room_inspections'),
    path('vouchers/', views.vouchers_view, name='vouchers'),
    path('vouchers/download/<int:voucher_id>/', views.download_voucher_pdf, name='download_voucher'),
    path('visitors/', views.visitors_view, name='visitors'),
    path('reports/', views.reports_dashboard_view, name='reports'),
    
    # Next.js API Routes
    path('api/v1/', include('hostel.api_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
