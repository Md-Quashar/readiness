from django.contrib.auth import authenticate
from rest_framework import status
from django.utils.decorators import method_decorator
from django_smart_ratelimit import ratelimit 
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, ActivityLog
from .serializers import UserSerializer, UserPublicSerializer, ActivityLogSerializer


def _token_pair(user):
    """Return a fresh access + refresh token dict for the given user."""
    refresh = RefreshToken.for_user(user)
   ## refresh.access_token.set_exp(lifetime=timedelta(hours=4))
    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }


# ─── POST /api/auth/register/ ────────────────────────────────────────────
class RegisterView(APIView):
    """
    Register a new user.

    Request body:
        { "name": "...", "email": "...", "password": "...", "role": "user|admin" }

    Response 201:
        { "user": {...}, "tokens": { "access": "...", "refresh": "..." } }
    """
    permission_classes = [AllowAny]

  #  @ratelimit(key='ip', rate='5/m', block=True)  # Limit to 5 registrations per minute per IP
    @method_decorator(ratelimit(key='ip', rate='20/m', block=True))
    def post(self, request):
        print("Registration request data:", request.data)  # Debug log
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    'user':   UserPublicSerializer(user).data,
                    'tokens': _token_pair(user),
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── POST /auth/login/ ───────────────────────────────────────────────

class LoginView(APIView):
    """
    Authenticate with email + password and receive JWT tokens.

    Request body:
        { "email": "...", "password": "..." }

    Response 200:
        { "user": {...}, "tokens": { "access": "...", "refresh": "..." } }
    """
    permission_classes = [AllowAny]

    @method_decorator(ratelimit(key='ip', rate='20/m', block=True))
    def post(self, request):
        print("Login request data:", request.data)  # Debug log
        email    = request.data.get('email', '').strip().lower()
        if email.count('@') != 1:
            return Response(
                {'error': 'Invalid email format.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'error': 'Both email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=email, password=password)

        if user is None:
            ActivityLog.log_activity(
                request=request,
                activity_type='login_failed',
                email=email,
                details={'reason': 'Invalid email or password.'}
            )
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            ActivityLog.log_activity(
                request=request,
                activity_type='login_failed',
                user=user,
                details={'reason': 'This account has been deactivated.'}
            )
            return Response(
                {'error': 'This account has been deactivated.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        ActivityLog.log_activity(
            request=request,
            activity_type='login_success',
            user=user
        )

        return Response(
            {
                'user':   UserPublicSerializer(user).data,
                'tokens': _token_pair(user),
            },
            status=status.HTTP_200_OK,
        )


# ─── GET /api/auth/profile/ ──────────────────────────────────────────────
class ProfileView(APIView):
    """
    Retrieve the currently authenticated user's profile.
    Requires:  Authorization: Bearer <access_token>
 
    Response 200:
        { "id": ..., "name": "...", "email": "...", "role": "...", "created_at": "..." }
    """
    permission_classes = [IsAuthenticated]

    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def get(self, request):
        return Response(
            UserPublicSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )

class GetUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))  # Limit to 50 user lookups per minute per IP
    def get(self, request):
        users = User.objects.all()
        serializer = UserPublicSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ─── POST /auth/reset-password/ ─────────────────────────────────────────
class ResetPasswordView(APIView):
    """
    Reset a user's password using their registered email.

    Request body:
        { "email": "...", "new_password": "..." }

    Response 200:
        { "message": "Password has been reset successfully." }
    """
    permission_classes = [AllowAny]

    @method_decorator(ratelimit(key='ip', rate='5/m', block=True))
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        new_password = request.data.get('new_password', '')

        if not email or not new_password:
            return Response(
                {'error': 'Both email and new password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate password strength
        if len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'No account found with this email address.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        user.set_password(new_password)
        user.save()

        ActivityLog.log_activity(
            request=request,
            activity_type='password_reset',
            user=user
        )

        return Response(
            {'message': 'Password has been reset successfully.'},
            status=status.HTTP_200_OK,
        )


# ─── GET /auth/activity-logs/ ───────────────────────────────────────────
class ActivityLogListView(APIView):
    """
    Retrieve activity logs (Admin only).
    """
    permission_classes = [IsAuthenticated]

    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def get(self, request):
        if request.user.role != 'admin':
            return Response(
                {'error': 'You do not have permission to view activity logs.'},
                status=status.HTTP_403_FORBIDDEN
            )
        logs = ActivityLog.objects.all().order_by('-created_at')[:1000]
        serializer = ActivityLogSerializer(logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

