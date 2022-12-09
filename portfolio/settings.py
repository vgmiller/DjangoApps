"""
Django settings for portfolio project.
Generated by 'django-admin startproject' using Django 3.0.6.
"""

import os
from decouple import config
config.encoding = 'cp1251'

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True
THUMBNAIL_DEBUG = DEBUG

ALLOWED_HOSTS = [
        'vgmraspberrypi',
        '192.168.1.24',
		'184.152.46.24',
		'localhost',
        '.larvalnemesis.com',
        '.vmillermusic.com',
        '.vmillerflute.com',
        '.vanessaflute.com',
        '.vanessapiccolo.com',
        ]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'sorl.thumbnail',
    'portfolio',
    'projectGallery',
    'blog',
    'naga',
    'music',
    'captcha',
	'mediaServer',
	'todo',
	'corsheaders',
	'rest_framework',
	'perfume',
	'webpack_loader',
	'hobbits',
]

MIDDLEWARE_CLASSES = [
    'sslify.middleware.SSLifyMiddleware',
        ]
MIDDLEWARE = [
    'django.contrib.sites.middleware.CurrentSiteMiddleware',
    'portfolio.seturlconfmiddleware.SetURLConfMiddleware',
    'portfolio.virtualhostmiddleware.VirtualHostMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'portfolio.urls'
SITE_ID = 1

LOGIN_REDIRECT_URL = "myProfile"
LOGOUT_REDIRECT_URL = "/naga"

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': ["portfolio/templates/"],
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

WSGI_APPLICATION = 'portfolio.wsgi.application'


# Database
# https://docs.djangoproject.com/en/3.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/3.0/ref/settings/#auth-password-validators

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


# Internationalization
# https://docs.djangoproject.com/en/3.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'America/New_York'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.0/howto/static-files/

SITE_URL = 'vgmraspberrypi'
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join( BASE_DIR, 'static/')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join( BASE_DIR, 'media/')
THUMBNAIL_PRESERVE_FORMAT = True
IMAGE_BREAKPOINTS = ["200", "544", "768", "1200", "1920"]

EMAIL_BACKEND = config('EMAIL_BACKEND')
AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')
AWS_SES_REGION_NAME = config('AWS_SES_REGION_NAME')
AWS_SES_REGION_ENDPOINT = config('AWS_SES_REGION_ENDPOINT')
DEFAULT_FROM_EMAIL = SERVER_EMAIL = EMAIL_HOST_USER = config('DEFAULT_FROM_EMAIL')

FITBIT_CLIENTID = config('FITBIT_CLIENTID')
FITBIT_CLIENTSECRET = config('FITBIT_CLIENTSECRET')
FITBIT_ACCESS_TOKEN = config('FITBIT_ACCESS_TOKEN')
FITBIT_REFRESH_TOKEN = config('FITBIT_REFRESH_TOKEN')

CORS_ORIGIN_WHITELIST = [
    'http://localhost:3000',
]
CORS_URLS_REGEX = r'^/api/.*$'
CORS_ALLOWED_ORIGINS = [
    "http://192.168.1.24:8000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://0.0.0.0",
	"http://www.larvalnemesis.com"
]
CSRF_TRUSTED_ORIGINS = [
    "http://192.168.1.24:8000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://0.0.0.0",
	"http://www.larvalnemesis.com"
]

WEBPACK_LOADER = {
  'DEFAULT': {
    'BUNDLE_DIR_NAME': 'perfume/',
    'STATS_FILE': os.path.join(BASE_DIR, 'perfume/webpack-stats.json')
  },
  'PERFUME': {
    'BUNDLE_DIR_NAME': 'perfume/',
    'STATS_FILE': os.path.join(BASE_DIR, 'perfume/webpack-stats.json')
  },
  'TODO': {
    'BUNDLE_DIR_NAME': 'todo/',
    'STATS_FILE': os.path.join(BASE_DIR, 'todo/webpack-stats.json')
  }
}

DEFAULT_RENDERER_CLASSES = [
        'rest_framework.renderers.JSONRenderer',
    ]

DEFAULT_AUTHENTICATION_CLASSES = [
    'rest_framework.authentication.BasicAuthentication',
]
if DEBUG:
    DEFAULT_RENDERER_CLASSES += [
        'rest_framework.renderers.BrowsableAPIRenderer',
    ]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': DEFAULT_AUTHENTICATION_CLASSES,
    'DEFAULT_RENDERER_CLASSES': DEFAULT_RENDERER_CLASSES
}
