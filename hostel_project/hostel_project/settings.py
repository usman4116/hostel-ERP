from pathlib import Path
import os
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-hostel-connect-secret-key-for-dev'

DEBUG = True

ALLOWED_HOSTS = ['*'] # In production on Vercel, this is usually fine, or you can restrict it to os.environ.get('ALLOWED_HOSTS', '*').split(',')

CSRF_TRUSTED_ORIGINS = [
    'https://*.up.railway.app',
    'https://*.railway.app',
    'https://*.vercel.app',
]

CORS_ALLOW_ALL_ORIGINS = True # Simplify CORS for Vercel deployment, or use CORS_ALLOWED_ORIGINS

INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt',
    'django_apscheduler',
    'hostel',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'hostel_project.settings.ApiTrailingSlashMiddleware',
]

class ApiTrailingSlashMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    def __call__(self, request):
        if request.path_info.startswith('/api/') and not request.path_info.endswith('/'):
            request.path_info += '/'
        return self.get_response(request)

ROOT_URLCONF = 'hostel_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'hostel' / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'hostel_project.wsgi.application'

DATABASES = {
    'default': dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        conn_health_checks=True,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'hostel' / 'static',
]
STATIC_ROOT = BASE_DIR / 'staticfiles'
if DEBUG:
    STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
else:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# --- Supabase Storage Configuration (AWS S3 Compatible) ---
if os.environ.get('USE_S3_STORAGE') == 'True':
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_ENDPOINT_URL = os.environ.get('AWS_S3_ENDPOINT_URL') # e.g. https://<project_ref>.supabase.co/storage/v1/s3
    AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME')
    
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    MEDIA_URL = f'{AWS_S3_ENDPOINT_URL}/{AWS_STORAGE_BUCKET_NAME}/'
else:
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Jazzmin Admin UI Customizations ---
JAZZMIN_SETTINGS = {
    "site_title": "OpenERP Admin",
    "site_header": "OpenERP Dashboard",
    "site_brand": "OpenERP",
    "site_logo": "images/logo.png",
    "welcome_sign": "Welcome to OpenERP Management System",
    "copyright": "OpenERP - Developed by Usman Farhan",
    "search_model": ["hostel.Student", "hostel.Complaint"],
    "topmenu_links": [
        {"name": "View Site", "url": "/", "permissions": ["auth.view_user"]},
        {"name": "Students", "url": "admin:hostel_student_changelist"},
        {"name": "Complaints", "url": "admin:hostel_complaint_changelist"},
        {"name": "Backup DB", "url": "/backup/"},
    ],
    "show_sidebar": True,
    "navigation_expanded": True,
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
        "django_apscheduler.DjangoJob": "fas fa-clock",
        "django_apscheduler.DjangoJobExecution": "fas fa-history",
        "hostel.Student": "fas fa-user-graduate",
        "hostel.Complaint": "fas fa-exclamation-triangle",
        "hostel.RentPaymentHistory": "fas fa-file-invoice-dollar",
        "hostel.Contact": "fas fa-envelope-open-text",
        "hostel.HostelRoom": "fas fa-bed",
        "hostel.RoomInspection": "fas fa-search",
        "hostel.SecurityDeposit": "fas fa-shield-alt",
        "hostel.StudentDocument": "fas fa-file-alt",
        "hostel.Visitor": "fas fa-walking",
        "hostel.Voucher": "fas fa-receipt",
        "hostel.CalendarEvent": "fas fa-calendar-alt",
        "hostel.CompanySettings": "fas fa-cogs",
        "hostel.StudentContract": "fas fa-file-signature",
    },
    "site_logo_classes": "img-fluid",
    "hide_apps": ["django_apscheduler"],
    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",
    "related_modal_active": True,
    "custom_css": "css/custom_admin.css",
    "custom_js": None,
    "use_google_fonts_cdn": True,
    "show_ui_builder": False,
    "changeform_format": "horizontal_tabs",
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-dark",
    "accent": "accent-primary",
    "navbar": "navbar-dark",
    "no_navbar_border": False,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-primary",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": True,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_hover_open": False,
    "theme": "darkly",
    "default_theme_mode": "dark",
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success"
    }
}

# Google Calendar Integration
GOOGLE_CALENDAR_API_KEY = "AIzaSyAGiTMuH5JFf-ZkIk8Uhb3AzU5Xmu9DtVQ"

# CORS Setup
CORS_ALLOW_ALL_ORIGINS = True # For development. In production, specify origins.
# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:3000",
# ]

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# SimpleJWT Settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# APScheduler settings
APSCHEDULER_DATETIME_FORMAT = "N j, Y, f:s a"
APSCHEDULER_RUN_NOW_TIMEOUT = 25  # Seconds
