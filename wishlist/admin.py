from django.contrib import admin
from .models import Wishlist , WishlistItem

@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'created_at',
        )
    list_filter = (
        'created_at',
        'is_active',
        )
    search_fields = (
        'user__email',
        )
    readonly_fields = (
        'created_at',
        'updated_at'
        )
    ordering = ('-created_at',)
    list_select_related = (
        'user',
        )
    autocomplete_fields = (
        'user',
        )

@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = (
        'wishlist',
        'variant',
        'created_at',
        )
    list_filter = (
        'created_at',
        'is_active',
        )
    search_fields = (
        'wishlist__user__email',
        'variant__name',
        )
    readonly_fields = (
        'created_at',
        )
    ordering = ('-created_at',)
    
    list_select_related = (
        'wishlist',
        'variant',
        )
    autocomplete_fields = (
        'wishlist',
        'variant',
        )