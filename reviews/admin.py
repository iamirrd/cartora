from django.contrib import admin
from .models import Review



@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'product',
        'user',
        'rating',
        'is_approved',
        'created_at',
        )
    list_filter = (
        'rating',
        'is_approved',
        'created_at',
        'is_active',
        )
    search_fields = (
        'title',
        'comment',
        'user__email',
        )
    readonly_fields = (
        'created_at',
        'updated_at'
        )
    list_select_related = (
        'product',
        'user',
        )
    autocomplete_fields = (
        'product',
        'user',
        )
    actions = ['approve_reviews', 'reject_reviews']
    ordering = ('-created_at',)
    
    @admin.action(description='تأیید نظرات انتخاب‌ شده')
    def approve_reviews(self, request, queryset):
        queryset.update(is_approved=True)

    @admin.action(description='رد نظرات انتخاب‌ شده')
    def reject_reviews(self, request, queryset):
        queryset.update(is_approved=False)