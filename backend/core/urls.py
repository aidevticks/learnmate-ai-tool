from django.urls import path
from .views import upload_pdf, register, login, logout,get_tokens_for_user
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('auth/register/', register),
    path('auth/login/', login),
    path('auth/logout/', logout),
    path('upload/', upload_pdf),
    path('refresh_token/', TokenRefreshView.as_view(), name='token_refresh'),
]