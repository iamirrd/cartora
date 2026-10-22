from django.contrib import admin
from .models import Address

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'receiver_name', 'receiver_phone', 'province', 'city', 'postal_code', 'is_default', 'created_at')
    list_filter = ('is_default', 'is_active', 'province', 'city')
    search_fields = ('user__email', 'user__phone', 'title', 'receiver_name', 'receiver_phone', 'province', 'city', 'postal_code')
    ordering = ('-is_default', '-created_at',)
    list_select_related = ('user',)
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('user',)