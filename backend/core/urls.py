from django.urls import path
from .views import register, login, logout

urlpatterns = [
    path('auth/register/', register),
    path('auth/login/', login),
    path('auth/logout/', logout),
]
