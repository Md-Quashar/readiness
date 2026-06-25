from django.contrib import admin
from .models import  Response

class ResponseInline(admin.TabularInline):
    model  = Response
    extra  = 0
    fields = ('question', 'answer', )




@admin.register(Response)
class ResponseAdmin(admin.ModelAdmin):
    list_display  = ('user', 'question','answer', 'lab_type', 'scope', 'created_at')
    search_fields = ('user__email', 'question__q_no')
