from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsAdmin, IsAdminOrReadOnly
from .models import Question, Section, Scope
from .serializers import QuestionSerializer, QuestionListSerializer, SectionSerializer, ScopeSerializer
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit

class ScopeViewSet(viewsets.ModelViewSet):
    """
    Admin  → full CRUD (GET, POST, PUT, PATCH, DELETE)
    User   → read-only  (GET only)
    """
    queryset = Scope.objects.all()
    serializer_class = ScopeSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['scope', 'id']
    ordering_fields    = ['id', 'scope']
    ordering           = ['id']

    @action(detail=False, methods=['get'], url_path='get',permission_classes=[IsAuthenticated])
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def getScope(self, request):
        qs = Scope.objects.all().order_by('id')
        serializer = ScopeSerializer(qs, many=True)
        return Response({'scopes' : serializer.data},status=status.HTTP_200_OK)   
    
    @action(detail=False, methods=['post'], url_path='create', permission_classes=[IsAdmin])
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def createScope(self, request):
        if request.user.role != 'admin':
            return Response(
                {'error': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        Scope.objects.create(scope=request.data.get('scope'))
        return Response({'message' : 'Scope created successfully'},status=status.HTTP_200_OK)   
    
    @action(detail=False, methods=['delete'], url_path='delete', permission_classes=[IsAdmin])
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def deleteScope(self, request, id=None):
        if request.user.role != 'admin':
            return Response(
                {'error': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        scope_id = id or request.query_params.get('id') or request.data.get('id')
        if not scope_id:
            return Response({'error': 'ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        Scope.objects.filter(id=scope_id).delete()
        return Response({'message' : 'Scope deleted successfully'},status=status.HTTP_200_OK)   
        
    @action(detail=False, methods=['put', 'patch'], url_path='update', permission_classes=[IsAdmin])
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def updateScope(self, request, id=None):
        if request.user.role != 'admin':
            return Response(
                {'error': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        scope_id = id or request.query_params.get('id') or request.data.get('id')
        if not scope_id:
            return Response({'error': 'ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        Scope.objects.filter(id=scope_id).update(scope=request.data.get('scope'))
        return Response({'message' : 'Scope updated successfully'},status=status.HTTP_200_OK)   
    
class SectionViewSet(viewsets.ModelViewSet):
    """
    Admin  → full CRUD (GET, POST, PUT, PATCH, DELETE)
    User   → read-only  (GET only)
    """
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['sectionName', 'id']
    ordering_fields    = ['id', 'sectionName']
    ordering           = ['id']

   

    @action(detail=False, methods=['get'], url_path='get',permission_classes=[IsAuthenticated])
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def getSection(self, request):
        qs = Section.objects.all().order_by('id')
        serializer = SectionSerializer(qs, many=True)
        return Response({'sections' : serializer.data},status=status.HTTP_200_OK)   
    
    @action(detail=False, methods=['post'], url_path='create', permission_classes=[IsAdmin])
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def createSection(self, request):
        if request.user.role != 'admin':
            return Response(
                {'error': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        Section.objects.create(sectionName=request.data.get('sectionName'))
        return Response({'message' : 'Section created successfully'},status=status.HTTP_200_OK)   
    
    @action(detail=False, methods=['delete'], url_path='delete', permission_classes=[IsAdmin])
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def deleteSection(self, request, id=None):
        if request.user.role != 'admin':
            return Response(
                {'error': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        sec_id = id or request.query_params.get('id') or request.data.get('id')
        if not sec_id:
            return Response({'error': 'ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        Section.objects.filter(id=sec_id).delete()
        return Response({'message' : 'Section deleted successfully'},status=status.HTTP_200_OK)   
        
    @action(detail=False, methods=['put', 'patch'], url_path='update', permission_classes=[IsAdmin])
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def updateSection(self, request, id=None):
        if request.user.role != 'admin':
            return Response(
                {'error': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        sec_id = id or request.query_params.get('id') or request.data.get('id')
        if not sec_id:
            return Response({'error': 'ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        Section.objects.filter(id=sec_id).update(sectionName=request.data.get('sectionName'))
        return Response({'message' : 'Section updated successfully'},status=status.HTTP_200_OK)   
    

class QuestionViewSet(viewsets.ModelViewSet):
    """
    Admin  → full CRUD (GET, POST, PUT, PATCH, DELETE)
    User   → read-only  (GET only)
    """
    queryset = Question.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['question', 'id']
    ordering_fields    = ['id', 'created_at']
    ordering           = ['id']

    def get_serializer_class(self):
        if self.action == 'list':
            return QuestionListSerializer
        return QuestionSerializer

    def get_queryset(self):
        qs = Question.objects.all()
        # Regular users only see active questions
        if not (self.request.user.is_authenticated and self.request.user.role == 'admin'):
            qs = qs.filter(is_active=True)
        # Optional filter by type
        q_type = self.request.query_params.get('type')
        if q_type:
            qs = qs.filter(question_type=q_type)
        return qs
    @action(detail=False, methods=['get'], url_path='all',
            permission_classes=[IsAdmin])
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def all_questions(self, request):
        """Shortcut: returns all questions (used by admin)."""
        if request.user.role != 'admin':
            return Response(
                {'error': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        qs = Question.objects.all().order_by('id')
        serializer = QuestionSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='active',
            permission_classes=[IsAuthenticated])
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def active_questions(self, request):
        """Shortcut: returns all active questions (used by assessment flow)."""
        qs = Question.objects.filter(is_active=True).order_by('id')
        serializer = QuestionSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='toggle-active',
            permission_classes=[IsAdmin])
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def toggle_active(self, request, pk=None):
        """Soft-enable / disable a question without deletion."""
        question = self.get_object()
        question.is_active = not question.is_active
        question.save(update_fields=['is_active'])
        return Response({'id': question.id, 'is_active': question.is_active})
    
    @action(detail=True, methods=['delete'], url_path='delete', permission_classes=[IsAdmin])
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def delete_question(self, request, pk=None):
        question = self.get_object()
        question_id = question.id  # Capture ID before it's gone
        question.delete()
        
        return Response({
            'id': question_id, 
            'message': 'Question deleted successfully'
        }, status=status.HTTP_200_OK)



    @action(detail=False, methods=['post'], url_path='create',
            permission_classes=[IsAdmin])
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def create_question(self, request):
        """Create multiple questions in one request (list payload)."""
        if not request.data:
            return Response(
                {'error': 'Expected a question object or list of question objects.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        is_many = isinstance(request.data, list)
        data = request.data if is_many else [request.data]
        
        # Remove 'id' from each object if present (can't be provided on creation)
        for item in data:
            if isinstance(item, dict) and 'id' in item:
                item.pop('id')
        
        serializer = QuestionSerializer(data=data, many=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



    @action(detail=False, methods=['put', 'patch'], url_path='update',
        permission_classes=[IsAdmin])
    @method_decorator(ratelimit(key='ip', rate='50/m', block=True))
    def update_question(self, request):
        """
        Update a question by taking question ID from request body.
        Replaces all provided fields and saves.
        """
        question_id = request.data.get('id')
        
        if not question_id:
            return Response({
                'error': 'Question ID is required in request body.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Fetch question from DB
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response({
                'error': f'Question with id {question_id} not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Remove 'id' from data before passing to serializer
        update_data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        update_data.pop('id', None)
        
        # Use serializer for partial update (PATCH allows partial fields)
        partial = request.method == 'PATCH'
        serializer = QuestionSerializer(question, data=update_data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Question updated successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)