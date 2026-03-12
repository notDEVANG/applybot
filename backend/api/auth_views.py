import json
import secrets
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db import IntegrityError
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import AuthToken

class RegisterView(APIView):
    def post(self, request):
        name = request.data.get("name", "").strip()
        email = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")

        if not name or not email or not password:
            return Response({"error": "All fields are required."}, status=400)
        if len(password) < 6:
            return Response({"error": "Password must be at least 6 characters."}, status=400)
        if User.objects.filter(email=email).exists():
            return Response({"error": "An account with this email already exists."}, status=400)

        try:
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=name.split()[0],
                last_name=" ".join(name.split()[1:]) if len(name.split()) > 1 else "",
            )
        except IntegrityError:
            return Response({"error": "Account already exists."}, status=400)

        token = AuthToken.objects.create(user=user)
        return Response({
            "token": token.key,
            "user": {
                "id": user.id,
                "name": f"{user.first_name} {user.last_name}".strip(),
                "email": user.email,
            }
        }, status=201)


class LoginView(APIView):
    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=400)

        user = authenticate(username=email, password=password)
        if not user:
            return Response({"error": "Incorrect email or password."}, status=401)

        # Delete old tokens and create fresh one
        AuthToken.objects.filter(user=user).delete()
        token = AuthToken.objects.create(user=user)

        return Response({
            "token": token.key,
            "user": {
                "id": user.id,
                "name": f"{user.first_name} {user.last_name}".strip() or user.email.split("@")[0],
                "email": user.email,
            }
        })


class LogoutView(APIView):
    def post(self, request):
        token_key = request.headers.get("Authorization", "").replace("Token ", "")
        AuthToken.objects.filter(key=token_key).delete()
        return Response({"message": "Logged out."})


class MeView(APIView):
    """Get current logged-in user info from token."""
    def get(self, request):
        token_key = request.headers.get("Authorization", "").replace("Token ", "")
        try:
            token = AuthToken.objects.get(key=token_key)
            user = token.user
            return Response({
                "id": user.id,
                "name": f"{user.first_name} {user.last_name}".strip() or user.email.split("@")[0],
                "email": user.email,
            })
        except AuthToken.DoesNotExist:
            return Response({"error": "Invalid or expired token."}, status=401)
