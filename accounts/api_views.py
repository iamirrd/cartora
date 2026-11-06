from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import UserRegisterSerializer, UserLoginSerializer


class UserRegisterView(APIView):
    throttle_scope = "auth"
    permission_classes = [AllowAny]
    
    @extend_schema(request=UserRegisterSerializer, responses={201: inline_serializer(
        name='RegistrationResponse', fields={
            'user': UserRegisterSerializer(read_only=True),
            'refresh': serializers.CharField(), 'access': serializers.CharField(),
        },
    )})
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': serializer.data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class UserLoginView(TokenObtainPairView):
    throttle_scope = "auth"
    serializer_class = UserLoginSerializer


class UserLogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        request=inline_serializer(name='LogoutRequest', fields={'refresh': serializers.CharField()}),
        responses={205: inline_serializer(name='LogoutResponse', fields={'detail': serializers.CharField()})},
    )
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'detail': 'refresh token لازم است.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            if str(token.get('user_id')) != str(request.user.pk):
                return Response({'detail': 'This token belongs to another user.'}, status=status.HTTP_403_FORBIDDEN)
            token.blacklist()
            
            return Response(
                {'detail': 'با موفقیت خارج شدید.'},
                status=status.HTTP_205_RESET_CONTENT
            )
        
        except TokenError:
            return Response(
                {'detail': 'توکن نامعتبر یا منقضی شده است.'},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserTokenRefreshView(TokenRefreshView):
    throttle_scope = 'auth'
