from django.db import models

class Section(models.Model):
    sectionName = models.CharField(max_length=100)
  
    def __str__(self):
        return self.sectionName

class Scope(models.Model):
    scope = models.CharField(max_length=100)
    
    def __str__(self):
        return self.scope

class Question(models.Model):
    question        = models.TextField(help_text="The question text shown to the user")
    explanation     = models.TextField(blank=True, help_text="Why this question matters / regulatory context")
    question_section = models.ForeignKey(Section, on_delete=models.CASCADE,blank=True, null=True)
    feedback_for_yes = models.TextField(blank=True, help_text="Feedback text when answer is Yes / compliant")
    feedback_for_no  = models.TextField(blank=True, help_text="Feedback text when   answer is No / non-compliant")
    guidance        = models.TextField(blank=True, help_text="Additional guidance or resources for this question")  
    is_active       = models.BooleanField(default=True, help_text="Soft-delete / hide from assessments")
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'questions'
        ordering = ['id']

    def __str__(self):
        return f"Q{self.id}: {self.question[:60]}"
