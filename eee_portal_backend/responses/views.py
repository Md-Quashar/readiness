from rest_framework import status, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response as DRFResponse
from .models import Response as UserResponse
from .serializers import ResponseSerializer
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from django.db.models import Count
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
        # Authenticated user actions (includes my_responses, submission, etc.)
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
       # print("Responses:", responses.count())  # Debug log
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

    # POST /responses/submission
    # Upsert: updates existing responses when user submits the assessment
    @action(detail=False, methods=['post'], url_path='submission')
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def submission(self, request):
        if not isinstance(request.data, list):
            return DRFResponse({"error": "Expected a list of items"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data, many=True)
        if serializer.is_valid():
            saved_objects = []
            for item in serializer.validated_data:
                defaults = {
                    'answer': item['answer'],
                    'lab_type': item.get('lab_type', ''),
                    'scope': item.get('scope', []),
                }
                obj, created = UserResponse.objects.update_or_create(
                    user=request.user,
                    question=item['question'],
                    defaults=defaults,
                )
                saved_objects.append(obj)

            first_item = serializer.validated_data[0] if serializer.validated_data else {}
            from users.models import ActivityLog
            ActivityLog.log_activity(
                request=request,
                activity_type='submission',
                user=request.user,
                details={
                    'count': len(serializer.validated_data),
                    'lab_type': first_item.get('lab_type', ''),
                    'scope': first_item.get('scope', [])
                }
            )

            result_serializer = self.get_serializer(saved_objects, many=True)
            return DRFResponse(result_serializer.data, status=status.HTTP_200_OK)
        return DRFResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # GET /responses/my-responses/  — authenticated user gets their own responses
    @action(detail=False, methods=['get'], url_path='my-responses')
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def my_responses(self, request):
        """Return all responses for the currently authenticated user."""
        responses = self.queryset.filter(user=request.user)
        if not responses.exists():
            return DRFResponse([], status=status.HTTP_200_OK)
        serializer = self.get_serializer(responses, many=True)
        return DRFResponse(serializer.data)

    @action(detail=False, methods=['get'], url_path='total-response-count')
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def total_responses(self, request):
        """Shortcut: returns total number of responses (used by admin)."""
        if request.user.role != 'admin':
            return DRFResponse(
                {'error': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        #total = self.queryset.count()
        count = self.queryset.values('user_id').annotate(total=Count('id'))
        print("Result:", count) 
        return DRFResponse(count, status=status.HTTP_200_OK)