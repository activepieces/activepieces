#!/bin/bash
# Simulates Paystack webhook events to test our backend logic.
# No Paystack account needed. No real money. Fully automated.
set -e

WEBHOOK="https://flow.synkra.co.za/api/v1/synkra/paystack/webhook"
USER_ID="${1:-nNeSn3G76HF61il4jU5RQ}"
PLATFORM_ID="${2:-EwKJJqAW0qg1wN38CQ5Bq}"

echo "════════════════════════════════════════════════════════════════"
echo "  Test 1: Upgrade to Starter"
echo "════════════════════════════════════════════════════════════════"
REF="sim-upgrade-$(date +%s)"
curl -sS -X POST "$WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "{\"event\":\"charge.success\",\"data\":{\"reference\":\"$REF\",\"amount\":29900,\"metadata\":{\"userId\":\"$USER_ID\",\"tier\":\"starter\",\"source\":\"synkra-flow\"},\"plan\":{\"interval\":\"monthly\",\"plan_code\":\"PLN_15wpi28chj8eg2e\"},\"customer\":{\"customer_code\":\"CUS_sim\"},\"subscription\":{\"subscription_code\":\"SUB_sim\"}}}"
echo ""
echo "→ verify:"
docker exec synkra-flow-postgres psql -U postgres -d activepieces -t -c \
  "SELECT tier, status, \"currentPeriodEnd\" FROM synkra_subscription WHERE \"userId\" = '$USER_ID';"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Test 2: Upgrade to Business"
echo "════════════════════════════════════════════════════════════════"
REF="sim-upgrade2-$(date +%s)"
curl -sS -X POST "$WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "{\"event\":\"charge.success\",\"data\":{\"reference\":\"$REF\",\"amount\":59900,\"metadata\":{\"userId\":\"$USER_ID\",\"tier\":\"business\",\"source\":\"synkra-flow\"},\"plan\":{\"interval\":\"monthly\",\"plan_code\":\"PLN_rkob6fqorz4mdxw\"},\"customer\":{\"customer_code\":\"CUS_sim2\"},\"subscription\":{\"subscription_code\":\"SUB_sim2\"}}}"
echo ""
echo "→ verify:"
docker exec synkra-flow-postgres psql -U postgres -d activepieces -t -c \
  "SELECT tier, status FROM synkra_subscription WHERE \"userId\" = '$USER_ID';"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Test 3: Buy 1,000 AI credits"
echo "════════════════════════════════════════════════════════════════"
REF_ADDON="sim-addon-ai-$(date +%s)"
curl -sS -X POST "$WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "{\"event\":\"charge.success\",\"data\":{\"reference\":\"$REF_ADDON\",\"amount\":5000,\"metadata\":{\"purchaseType\":\"addon_pack\",\"packId\":\"ai-1k\",\"kind\":\"ai\",\"amount\":1000,\"priceZar\":50,\"userId\":\"$USER_ID\",\"platformId\":\"$PLATFORM_ID\"}}}"
echo ""
echo "→ verify:"
docker exec synkra-flow-postgres psql -U postgres -d activepieces -t -c \
  "SELECT kind, \"amountPurchased\", \"amountRemaining\", \"pricePaidZar\" FROM synkra_credit_lot WHERE \"userId\" = '$USER_ID' ORDER BY created DESC LIMIT 3;"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Test 4: Buy 5,000 emails"
echo "════════════════════════════════════════════════════════════════"
REF_MAIL="sim-addon-email-$(date +%s)"
curl -sS -X POST "$WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "{\"event\":\"charge.success\",\"data\":{\"reference\":\"$REF_MAIL\",\"amount\":25000,\"metadata\":{\"purchaseType\":\"addon_pack\",\"packId\":\"email-5k\",\"kind\":\"email\",\"amount\":5000,\"priceZar\":250,\"userId\":\"$USER_ID\",\"platformId\":\"$PLATFORM_ID\"}}}"
echo ""
echo "→ verify:"
docker exec synkra-flow-postgres psql -U postgres -d activepieces -t -c \
  "SELECT kind, \"amountPurchased\", \"amountRemaining\" FROM synkra_credit_lot WHERE \"userId\" = '$USER_ID' ORDER BY created DESC LIMIT 3;"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Test 5: Idempotency — same reference twice should NOT duplicate"
echo "════════════════════════════════════════════════════════════════"
REF_DUP="sim-idempotent-$(date +%s)"
BODY="{\"event\":\"charge.success\",\"data\":{\"reference\":\"$REF_DUP\",\"amount\":5000,\"metadata\":{\"purchaseType\":\"addon_pack\",\"packId\":\"ai-1k\",\"kind\":\"ai\",\"amount\":1000,\"priceZar\":50,\"userId\":\"$USER_ID\",\"platformId\":\"$PLATFORM_ID\"}}}"
curl -sS -X POST "$WEBHOOK" -H "Content-Type: application/json" -d "$BODY" > /dev/null
curl -sS -X POST "$WEBHOOK" -H "Content-Type: application/json" -d "$BODY" > /dev/null
echo "→ count of lots with that reference (should be 1):"
docker exec synkra-flow-postgres psql -U postgres -d activepieces -t -c \
  "SELECT COUNT(*) FROM synkra_credit_lot WHERE \"paystackReference\" = '$REF_DUP';"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Test 6: Subscription cancel"
echo "════════════════════════════════════════════════════════════════"
curl -sS -X POST "$WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "{\"event\":\"subscription.not_renew\",\"data\":{\"subscription_code\":\"SUB_sim2\"}}"
echo ""
echo "→ verify (cancelAtPeriodEnd should be true):"
docker exec synkra-flow-postgres psql -U postgres -d activepieces -t -c \
  "SELECT tier, status, \"cancelAtPeriodEnd\" FROM synkra_subscription WHERE \"userId\" = '$USER_ID';"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ALL SIMULATED TESTS COMPLETE"
echo "════════════════════════════════════════════════════════════════"
