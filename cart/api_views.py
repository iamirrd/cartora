from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework.exceptions import ValidationError
from rest_framework.viewsets import ModelViewSet
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from rest_framework.permissions import IsAuthenticated


class CartViewSet(ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Cart.objects.filter(user_id=self.request.user.pk)
    
    def perform_create(self, serializer):
        cart, created = Cart.objects.get_or_create(
            user=self.request.user, defaults=serializer.validated_data
        )
        if not created:
            raise ValidationError('A cart already exists for this user.')
        serializer.instance = cart

class CartItemViewSet(ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CartItem.objects.filter(cart__user_id=self.request.user.pk).order_by('pk')
    
    @transaction.atomic
    def perform_create(self, serializer):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        cart = Cart.objects.select_for_update().get(pk=cart.pk)
        variant = serializer.validated_data['variant']
        if cart.items.filter(variant=variant).exists():
            raise ValidationError({'variant': 'This variant is already in the cart.'})
        serializer.save(
            cart=cart,
            price=variant.price,
            discount_price=variant.discount_price,
        )
    @transaction.atomic
    def perform_update(self, serializer):
        Cart.objects.select_for_update().get(pk=serializer.instance.cart_id)
        serializer.instance = get_object_or_404(CartItem, pk=serializer.instance.pk)
        serializer.validate(serializer.validated_data)
        variant = serializer.validated_data.get('variant', serializer.instance.variant)
        if serializer.instance.cart.items.filter(variant=variant).exclude(pk=serializer.instance.pk).exists():
            raise ValidationError({'variant': 'This variant is already in the cart.'})
        serializer.save()
