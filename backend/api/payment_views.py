import razorpay
import hmac
import hashlib
import json
import os
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import AuthToken, Subscription

RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET")

PLANS = {
    "starter": {"amount": 29900, "name": "Starter Plan", "daily_limit": 25},  # ₹299 in paise
    "pro":     {"amount": 59900, "name": "Pro Plan",     "daily_limit": 999}, # ₹599 in paise
}

def get_user_from_request(request):
    """Extract user from Authorization token header."""
    token_key = request.headers.get("Authorization", "").replace("Token ", "")
    try:
        return AuthToken.objects.get(key=token_key).user
    except AuthToken.DoesNotExist:
        return None


class CreateOrderView(APIView):
    """Step 1 — Create a Razorpay order and return order_id to frontend."""
    def post(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"error": "Unauthorized"}, status=401)

        plan_id = request.data.get("plan")
        if plan_id not in PLANS:
            return Response({"error": "Invalid plan"}, status=400)

        plan = PLANS[plan_id]

        try:
            client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
            order = client.order.create({
                "amount": plan["amount"],
                "currency": "INR",
                "receipt": f"applybot_{user.id}_{plan_id}",
                "notes": {
                    "user_id": str(user.id),
                    "plan": plan_id,
                    "email": user.email,
                }
            })
            return Response({
                "order_id": order["id"],
                "amount": plan["amount"],
                "currency": "INR",
                "plan": plan_id,
                "plan_name": plan["name"],
                "key_id": RAZORPAY_KEY_ID,
            })
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class VerifyPaymentView(APIView):
    """Step 2 — Verify payment signature and upgrade user plan."""
    def post(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"error": "Unauthorized"}, status=401)

        razorpay_order_id   = request.data.get("razorpay_order_id")
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature  = request.data.get("razorpay_signature")
        plan_id             = request.data.get("plan")

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id]):
            return Response({"error": "Missing payment details"}, status=400)

        # ── Verify signature (security check) ──────────────────
        msg = f"{razorpay_order_id}|{razorpay_payment_id}"
        expected = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            msg.encode(),
            "sha256"
        ).hexdigest()

        if expected != razorpay_signature:
            return Response({"error": "Payment verification failed"}, status=400)

        # ── Upgrade user plan in database ──────────────────────
        plan = PLANS.get(plan_id, PLANS["starter"])
        sub, _ = Subscription.objects.get_or_create(user=user)
        sub.plan = plan_id
        sub.daily_limit = plan["daily_limit"]
        sub.razorpay_payment_id = razorpay_payment_id
        sub.razorpay_order_id = razorpay_order_id
        sub.is_active = True
        sub.save()

        return Response({
            "success": True,
            "plan": plan_id,
            "message": f"Successfully upgraded to {plan['name']}!",
            "daily_limit": plan["daily_limit"],
        })


class SubscriptionStatusView(APIView):
    """Get current user's subscription plan."""
    def get(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"error": "Unauthorized"}, status=401)

        try:
            sub = Subscription.objects.get(user=user)
            return Response({
                "plan": sub.plan,
                "daily_limit": sub.daily_limit,
                "is_active": sub.is_active,
            })
        except Subscription.DoesNotExist:
            return Response({
                "plan": "free",
                "daily_limit": 5,
                "is_active": True,
            })
