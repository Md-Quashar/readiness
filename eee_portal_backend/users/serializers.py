from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8,)

    class Meta:
        model  = User
        fields = ['id', 'name', 'email', 'role', 'password', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        password = validated_data.pop('password')
        return User.objects.create_user(password=password, **validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserPublicSerializer(serializers.ModelSerializer):
    """Safe read-only view of a user (no password)."""
    class Meta:
        model  = User
        fields = ['id', 'name', 'email', 'role', 'created_at', 'updated_at']
        read_only_fields = fields
