from django.urls import path
from .api_views import PaymentRequestView, PaymentVerifyView, TransactionListView

urlpatterns = [
    path('request/', PaymentRequestView.as_view(), name='payment-request'),
    path('verify/', PaymentVerifyView.as_view(), name='payment-verify'),
    path('transactions/', TransactionListView.as_view(), name='transaction-list'),
]