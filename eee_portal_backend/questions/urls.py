from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuestionViewSet, SectionViewSet, ScopeViewSet

router = DefaultRouter()

router.register(r'sections', SectionViewSet, basename='section')
router.register(r'scopes', ScopeViewSet, basename='scope')
router.register(r'', QuestionViewSet, basename='question')

urlpatterns = [
    path('', include(router.urls)),
]

