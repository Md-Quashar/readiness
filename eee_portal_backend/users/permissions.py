from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to users with role == 'admin'."""
    message = 'Only admin users are allowed to perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'admin'
        )


class IsAdminOrReadOnly(BasePermission):
    """Admins can write; authenticated users can read."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user.role == 'admin'
