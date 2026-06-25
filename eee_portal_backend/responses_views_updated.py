from rest_framework import  status, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response as DRFResponse
from .models import Response as UserResponse
from .serializers import ResponseSerializer

class IsAdminUserRole(permissions.BasePermission):
    """Custom permission to allow only users with 'admin' role."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'role', None) == 'admin'

class ResponseViewSet(viewsets.ModelViewSet):
    queryset = UserResponse.objects.all()
    serializer_class = ResponseSerializer
    permission_classes = [IsAdminUserRole]

    @action(detail=True, methods=['get'], url_path='get-response')
    def get_user_response(self, request, pk=None):
        """Returns ALL response records for the user with the given ID."""
        # 1. Filter the database for all records matching this user ID
        responses = self.queryset.filter(user_id=pk) 
    
        # 2. Check if records exist (Optional but recommended)
        if not responses.exists():
            return DRFResponse(
                {"message": "No responses found for this user"}, 
                status=status.HTTP_404_NOT_FOUND
        )

         # 3. Pass many=True because 'responses' is a list (QuerySet), not one object
        serializer = self.get_serializer(responses, many=True)
    
        return DRFResponse(serializer.data)

    # Change methods to include 'delete'
    @action(detail=True, methods=['delete'], url_path='delete-response')
    def delete_user_response(self, request, pk=None):
        responses = self.queryset.filter(user_id=pk)
        count, _ = responses.delete()
        return DRFResponse({"message": f"Deleted {count} records"}, status=status.HTTP_200_OK)


    # 3. POST /single-response
    @action(detail=False, methods=['post'], url_path='single-response')
    def single_response(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return DRFResponse(serializer.data, status=status.HTTP_201_CREATED)
        return DRFResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 4. POST /bulk-response
    @action(detail=False, methods=['post'], url_path='bulk-response')
    def bulk_response(self, request):
        if not isinstance(request.data, list):
            return DRFResponse({"error": "Expected a list of items"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=request.data, many=True)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return DRFResponse(serializer.data, status=status.HTTP_201_CREATED)
        return DRFResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

