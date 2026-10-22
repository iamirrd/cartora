from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView

from .models import Transaction
from .serializers import TransactionSerializer, PaymentRequestSerializer
from .services import process_payment, verify_payment


class PaymentRequestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = PaymentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        order_id = serializer.validated_data['order_id']
        success, message = process_payment(order_id, request.user)
        
        if success:
            return Response({'payment_url': message}, status=status.HTTP_200_OK)
        return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)


class PaymentVerifyView(APIView):
    permission_classes = []   # عمومی (کال‌بک درگاه)
    
    def get(self, request):
        authority = request.query_params.get('authority')
        status_param = request.query_params.get('status')
        
        if not authority:
            return Response({'error': 'authority یافت نشد'}, status=status.HTTP_400_BAD_REQUEST)
        
        success, message = verify_payment(authority, status_param)
        
        if success:
            return Response({'message': message}, status=status.HTTP_200_OK)
        return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)


class TransactionListView(ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)