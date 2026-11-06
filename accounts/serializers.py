from django.db import IntegrityError, transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password

from accounts.models import User


class UserRegisterSerializer(serializers.ModelSerializer):
    
    password = serializers.CharField(
        write_only=True,
        required=True,
    )
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'phone', 'first_name', 'last_name')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError('Passwords do not match')
        validate_password(attrs['password'], user=User(**{key: value for key, value in attrs.items() if key not in ('password', 'password2')}))
        return attrs
    
    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Email already exists')
        return value
    
    def validate_phone(self, value):
        value = value or None
        if value and User.objects.filter(phone=value).exists():
            raise serializers.ValidationError('Phone already exists')
        return value
    
    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        validated_data['username'] = validated_data['email']
        try:
            with transaction.atomic():
                return User.objects.create_user(password=password, **validated_data)
        except IntegrityError:
            raise serializers.ValidationError('An account with this email or phone already exists.')


class UserLoginSerializer(TokenObtainPairSerializer):
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'phone': self.user.phone,
            'is_phone_verified': self.user.is_phone_verified,
        }
        return data
    
class UserSerializer(serializers.ModelSerializer): 
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone', 'is_phone_verified')
        read_only_fields = ('id', 'email', 'is_phone_verified')