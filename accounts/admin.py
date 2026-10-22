from django.contrib import admin
from .models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin



@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'is_active', 'is_phone_verified']
    search_fields = ['email', 'first_name', 'last_name']
    list_filter = ['is_active', 'is_phone_verified']
    ordering = ['email']
