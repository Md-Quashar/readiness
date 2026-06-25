from django.db import models
from django.conf import settings
from questions.models import Question
from django.contrib.postgres.fields import ArrayField



class Response(models.Model):
    """Single answer to one question within a session."""
    ANSWER_CHOICES = [
        ('yes',  'Yes'),
        ('no',   'No'),
   
    ]

    user  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.PROTECT,
        related_name='responses'
    )
    answer        = models.CharField(max_length=10, choices=ANSWER_CHOICES)
    lab_type    = models.CharField(max_length=100, blank=True)
    scope = ArrayField(
            models.CharField(max_length=255, blank=True),
            blank=True,
            default=list  # Empty list by default
        )   
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)
    class Meta:
        db_table        = 'responses'
        unique_together = ('user', 'question')   # one answer per question per user
        ordering        = ['question__id']  # keep responses ordered by question for easier processing

    def save(self, *args, **kwargs):
        # Auto-compute compliance based on answer
        if self.answer == 'yes':
            self.is_compliant = True
        elif self.answer == 'no':
            self.is_compliant = False
        else:
            self.is_compliant = None
        super().save(*args, **kwargs)

    def __str__(self):
        return f"User: {self.user.email} | Q{self.question.id} → {self.answer}" 