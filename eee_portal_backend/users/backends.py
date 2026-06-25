from django.contrib.auth.backends import ModelBackend
from .models import User


class EmailBackend(ModelBackend):
    """
    Authenticate using email instead of username.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username:
            return None
        # normalize and perform case-insensitive lookup to avoid failures
        username_norm = username.strip()
        try:
            user = User.objects.filter(email__iexact=username_norm).first()
            if user is None:
                return None
        except User.DoesNotExist:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
