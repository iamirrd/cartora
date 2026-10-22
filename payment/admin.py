from django.contrib import admin
from .models import Gateway, Transaction


@admin.register(Gateway)
class GatewayAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active')


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('order', 'user', 'amount', 'status', 'ref_id', 'created_at')
    list_filter = ('status', 'gateway', 'created_at')
    search_fields = ('order__order_number', 'user__email', 'ref_id')
    readonly_fields = ('created_at', 'updated_at')