from django.db import transaction
from rest_framework import serializers
from .models import Notification
from fcm_django.models import FCMDevice

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'title', 'message', 'notification_type', 'is_read', 'created_at')
        read_only_fields = fields

class FCMDeviceSerializer(serializers.ModelSerializer):
    registration_id = serializers.CharField(max_length=4096)

    def validate_registration_id(self, value):
        if FCMDevice.objects.filter(registration_id=value).exclude(user=self.context['request'].user).exists():
            raise serializers.ValidationError('This device is registered to another user.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        registration_id = validated_data.pop('registration_id')
        device, created = FCMDevice.objects.select_for_update().get_or_create(
            registration_id=registration_id, defaults={**validated_data, 'active': True},
        )
        if not created:
            if device.user_id != validated_data['user'].pk:
                raise serializers.ValidationError({'registration_id': 'This device belongs to another user.'})
            device.type = validated_data['type']
            device.active = True
            device.save(update_fields=['type', 'active'])
        return device

    class Meta:
        model = FCMDevice
        fields = ('id', 'registration_id', 'type')
        read_only_fields = ('id',)