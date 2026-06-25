from django.contrib import admin
from .models import Question,Scope,Section

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display   = ('id', 'question', 'question_section', 'is_active', 'created_at')
    list_filter    = ('is_active',)
    search_fields  = ('question', 'id', 'question_section__sectionName')
    ordering       = ('id',)
    list_editable  = ('is_active',)
    fieldsets      = (
        ('Core', {'fields': (  'question', 'question_section', 'is_active')}),
        ('Guidance', {'fields': ('explanation', 'feedback_for_yes', 'feedback_for_no', 'guidance')}),
      
    )
@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('id', 'sectionName')
    list_filter = ('id',)
    search_fields = ('sectionName', 'id')
    ordering = ('id',)
    list_editable = ('sectionName',)

@admin.register(Scope)
class ScopeAdmin(admin.ModelAdmin):
    list_display = ('id', 'scope')
    list_filter = ('id',)
    search_fields = ('scope', 'id')
    ordering = ('id',)
    list_editable = ('scope',)