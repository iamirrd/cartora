from rest_framework import serializers
from .models import Notification
from fcm_django.models import FCMDevice

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'title', 'message', 'notification_type', 'is_read', 'created_at')
        read_only_fields = fields

class FCMDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FCMDevice
        fields = ('id', 'registration_id', 'type')