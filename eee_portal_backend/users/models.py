from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, role='applicant' ):
        if not email:
            raise ValueError('Email is required')
        user = self.model(email=self.normalize_email(email), name=name, role=role)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None):
        user = self.create_user(
            email=email,
            name=name,
            password=password,
            role='admin',
            
        )
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('applicant',  'Applicant'),
    ]

    
    name      = models.CharField(max_length=150)
    email     = models.EmailField(unique=True)
    role      = models.CharField(max_length=10, choices=ROLE_CHOICES, default='applicant')
    is_active = models.BooleanField(default=True)
    is_staff  = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['name']

    objects = UserManager()

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} <{self.email}> [{self.role}]"

    @property
    def is_admin(self):
        return self.role == 'admin'


class ActivityLog(models.Model):
    ACTIVITY_TYPES = [
        ('login_success', 'Login Success'),
        ('login_failed', 'Login Failed'),
        ('submission', 'Submission'),
        ('password_reset', 'Password Reset'),
        ('question_created', 'Question Created'),
        ('question_updated', 'Question Updated'),
        ('question_deleted', 'Question Deleted'),
        ('question_toggled', 'Question Toggled'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs'
    )
    user_email = models.CharField(max_length=255, blank=True)
    user_name = models.CharField(max_length=150, blank=True)
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user_email} | {self.activity_type} | {self.created_at}"

    @classmethod
    def log_activity(cls, request, activity_type, user=None, email=None, name=None, details=None):
        try:
            if details is None:
                details = {}
            
            # Determine IP address
            ip = None
            for header in ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CF_CONNECTING_IP', 'HTTP_CLIENT_IP', 'HTTP_X_CLIENT_IP']:
                val = request.META.get(header)
                if val:
                    # Some headers like X-Forwarded-For can contain comma-separated IPs
                    ips = [x.strip() for x in val.split(',')]
                    # Use the first non-empty IP
                    for candidate in ips:
                        if candidate:
                            ip = candidate
                            break
                if ip:
                    break
            
            if not ip:
                ip = request.META.get('REMOTE_ADDR')
                
            # Determine User Agent
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            # Handle user/email/name resolution
            if user and not user.is_anonymous:
                log_user = user
                log_email = user.email
                log_name = user.name
            else:
                log_user = None
                log_email = email or ''
                log_name = name or ''
                if log_email:
                    try:
                        found_user = User.objects.filter(email__iexact=log_email).first()
                        if found_user:
                            log_user = found_user
                            log_name = found_user.name
                        else:
                            if not log_name:
                                log_name = log_email
                    except Exception:
                        pass
                
            return cls.objects.create(
                user=log_user,
                user_email=log_email,
                user_name=log_name,
                activity_type=activity_type,
                ip_address=ip,
                user_agent=user_agent,
                details=details
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to record activity log: {e}")
            return None

