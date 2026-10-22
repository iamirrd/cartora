from django.contrib import admin
from .models import ShippingMethod

@admin.register(ShippingMethod)
class ShippingMethodAdmin(admin.ModelAdmin):
    list_display = ('name', 'cost', 'delivery_time', 'is_active' , 'created_at')
    search_fields = ('name', 'description')
    list_filter = ('is_active' , 'created_at')
    ordering = ('cost',)
    readonly_fields = ('created_at',)
