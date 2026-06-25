from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
import os

def yml_view(request):
    # Render the raw OpenAPI YAML file in the browser
    file_path = os.path.join(settings.BASE_DIR, 'openapi.yml')
    with open(file_path, 'r') as f:
        content = f.read()
    return HttpResponse(content, content_type='text/plain')

urlpatterns = [
    path('admin/', admin.site.urls),
    # Microservice routes
    path('auth/',      include('users.urls')),
    path('questions/', include('questions.urls')),
    path('responses/', include('responses.urls')),
    path('yml/', yml_view, name='yml'),
]
