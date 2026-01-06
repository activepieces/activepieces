import { createPiece } from "@activepieces/pieces-framework";
import { pinchPaymentsAuth } from "./lib/common/auth";
import { createOrUpdatePayerAction } from "./lib/actions/create-or-update-payer";
import { createRealtimePaymentAction } from "./lib/actions/create-realtime-payment";
import { addSourceToPayerAction } from "./lib/actions/add-source-to-payer";
import { createOrUpdateScheduledPaymentAction } from "./lib/actions/create-or-update-scheduled-payment";
import { addSubscriptionAction } from "./lib/actions/add-subscription";
import { findEventAction } from "./lib/actions/find-event";
import { findPayerAction } from "./lib/actions/find-payer";
import { findSubscriptionAction } from "./lib/actions/find-subscription";
import { bankResultsTrigger } from "./lib/triggers/bank-results";
import { payerCreatedTrigger } from "./lib/triggers/payer-created";
import { payerUpdatedTrigger } from "./lib/triggers/payer-updated";
import { realtimePaymentTrigger } from "./lib/triggers/realtime-payment";
import { paymentCreatedTrigger } from "./lib/triggers/payment-created";
import { subscriptionCreatedTrigger } from "./lib/triggers/subscription-created";
import { subscriptionCancelledTrigger } from "./lib/triggers/subscription-cancelled";
import { subscriptionCompleteTrigger } from "./lib/triggers/subscription-complete";
import { refundCreatedTrigger } from "./lib/triggers/refund-created";
import { refundUpdatedTrigger } from "./lib/triggers/refund-updated";
import { scheduledProcessTrigger } from "./lib/triggers/scheduled-process";
import { transferTrigger } from "./lib/triggers/transfer";
import { disputeCreatedTrigger } from "./lib/triggers/dispute-created";
import { disputeUpdatedTrigger } from "./lib/triggers/dispute-updated";
import { PieceCategory } from "@activepieces/shared";

export const pinchPayments = createPiece({
  displayName: "Pinch Payments",
  description: "Australian payment processing platform for direct debits, credit cards, and recurring payments. Create payers, process payments, manage subscriptions, and handle payment sources with comprehensive webhook support.",
  auth: pinchPaymentsAuth,
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.PAYMENT_PROCESSING],
  logoUrl: "https://cdn.activepieces.com/pieces/pinch-payments.png",
  authors: ['onyedikachi-david'],
  actions: [
    createOrUpdatePayerAction,
    createRealtimePaymentAction,
    addSourceToPayerAction,
    createOrUpdateScheduledPaymentAction,
    addSubscriptionAction,
    findEventAction,
    findPayerAction,
    findSubscriptionAction,
  ],
  triggers: [
    bankResultsTrigger,
    payerCreatedTrigger,
    payerUpdatedTrigger,
    realtimePaymentTrigger,
    paymentCreatedTrigger,
    subscriptionCreatedTrigger,
    subscriptionCancelledTrigger,
    subscriptionCompleteTrigger,
    refundCreatedTrigger,
    refundUpdatedTrigger,
    scheduledProcessTrigger,
    transferTrigger,
    disputeCreatedTrigger,
    disputeUpdatedTrigger,
  ],
});