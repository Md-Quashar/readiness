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
            lab_type='admin'  # <-- Explicitly pass lab_type for superusers
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
