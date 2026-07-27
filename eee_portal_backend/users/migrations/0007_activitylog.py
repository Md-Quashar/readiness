# Generated manually

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_remove_user_lab_type'),
    ]

    operations = [
        migrations.CreateModel(
            name='ActivityLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user_email', models.CharField(blank=True, max_length=255)),
                ('user_name', models.CharField(blank=True, max_length=150)),
                ('activity_type', models.CharField(choices=[
                    ('login_success', 'Login Success'),
                    ('login_failed', 'Login Failed'),
                    ('submission_single', 'Single Response Submission'),
                    ('submission_bulk', 'Bulk Responses Submission'),
                    ('password_reset', 'Password Reset'),
                    ('question_created', 'Question Created'),
                    ('question_updated', 'Question Updated'),
                    ('question_deleted', 'Question Deleted'),
                    ('question_toggled', 'Question Toggled')
                ], max_length=30)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True)),
                ('details', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='activity_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'activity_logs',
                'ordering': ['-created_at'],
            },
        ),
    ]
