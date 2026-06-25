from django.urls import path
from .views import GetUserView, ProfileView, RegisterView, LoginView, ResetPasswordView



urlpatterns = [
  path('register/', RegisterView.as_view(), name='auth-register'),
  path('login/',    LoginView.as_view(),    name='auth-login'),
  path('profile/',  ProfileView.as_view(),  name='auth-profile'),
  path('get-user/',  GetUserView.as_view(),  name='auth-get_user'),
  path('reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
]
