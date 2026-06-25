from rest_framework import status, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response as DRFResponse
from .models import Response as UserResponse
from .serializers import ResponseSerializer
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit

class IsAdminUserRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'role', None) == 'admin'

class IsAuthenticatedUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

class ResponseViewSet(viewsets.ModelViewSet):
    queryset = UserResponse.objects.all()
    serializer_class = ResponseSerializer

    def get_permissions(self):
        # Admin-only actions
        if self.action in ['list', 'destroy', 'get_user_response', 'delete_user_response']:
            return [IsAdminUserRole()]
        # Authenticated user actions
        return [IsAuthenticatedUser()]

    # GET /responses/  — admin gets all responses
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def list(self, request, *args, **kwargs):
        responses = UserResponse.objects.all().order_by('-created_at')
        serializer = self.get_serializer(responses, many=True)
        return DRFResponse(serializer.data)

    # GET /responses/{id}/get-response  — admin gets all responses for user id
    @action(detail=True, methods=['get'], url_path='get-response')
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def get_user_response(self, request, pk=None):
        # Validate that pk is numeric
        if not str(pk).isdigit():
            return DRFResponse({"error": "Invalid ID. ID must be a number."}, status=status.HTTP_400_BAD_REQUEST)
        
        responses = self.queryset.filter(user_id=pk)
        if not responses.exists():
            return DRFResponse({"message": "No responses found for this user"}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(responses, many=True)
        return DRFResponse(serializer.data)

    # DELETE /responses/{id}/delete-response/
    @action(detail=True, methods=['delete'], url_path='delete-response')
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def delete_user_response(self, request, pk=None):
        # Validate that pk is numeric
        if not str(pk).isdigit():
            return DRFResponse({"error": "Invalid ID. ID must be a number."}, status=status.HTTP_400_BAD_REQUEST)
        
        responses = self.queryset.filter(user_id=pk)
        count, _ = responses.delete()
        return DRFResponse({"message": f"Deleted {count} records"}, status=status.HTTP_200_OK)

    # POST /responses/single-response
    @action(detail=False, methods=['post'], url_path='single-response')
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def single_response(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return DRFResponse(serializer.data, status=status.HTTP_201_CREATED)
        return DRFResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # POST /responses/bulk-response
    @action(detail=False, methods=['post'], url_path='bulk-response')
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def bulk_response(self, request):
        print("Bulk response request data:", request.data)  # Debug log
        if not isinstance(request.data, list):
            return DRFResponse({"error": "Expected a list of items"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=request.data, many=True)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return DRFResponse(serializer.data, status=status.HTTP_201_CREATED)
        return DRFResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
