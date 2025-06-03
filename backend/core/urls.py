from django.urls import path
from .views import upload_pdf, register, login, logout

urlpatterns = [
    path('auth/register/', register),
    path('auth/login/', login),
    path('auth/logout/', logout),
    path('upload/', upload_pdf),
]