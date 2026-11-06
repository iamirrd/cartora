from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticatedOrReadOnly, SAFE_METHODS, BasePermission
from rest_framework.viewsets import ModelViewSet

from .models import Review
from .serializers import ReviewSerializer


class ReviewAccess(BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.method in SAFE_METHODS or obj.user_id == request.user.pk or request.user.is_staff


class ReviewViewSet(ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, ReviewAccess]

    def get_queryset(self):
        queryset = Review.objects.select_related('product', 'user')
        if self.request.user.is_staff:
            return queryset
        visible = Q(is_approved=True, is_active=True)
        if self.request.user.is_authenticated:
            visible |= Q(user=self.request.user)
        return queryset.filter(visible)

    def perform_create(self, serializer):
        try:
            with transaction.atomic():
                serializer.save(user=self.request.user)
        except IntegrityError:
            raise ValidationError({'product': 'You have already reviewed this product.'})

    def perform_update(self, serializer):
        try:
            with transaction.atomic():
                serializer.save(is_approved=False)
        except IntegrityError:
            raise ValidationError({'product': 'You have already reviewed this product.'})
