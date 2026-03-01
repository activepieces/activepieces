import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { lemonSqueezyAuth } from "./lib/common/auth";
import { orderCreatedTrigger } from "./lib/triggers/order-created";
import { orderRefundedTrigger } from "./lib/triggers/order-refunded";
import { subscriptionCreatedTrigger } from "./lib/triggers/subscription-created";
import { subscriptionUpdatedTrigger } from "./lib/triggers/subscription-updated";
import { subscriptionCancelledTrigger } from "./lib/triggers/subscription-cancelled";
import { subscriptionResumedTrigger } from "./lib/triggers/subscription-resumed";
import { subscriptionExpiredTrigger } from "./lib/triggers/subscription-expired";
import { subscriptionPausedTrigger } from "./lib/triggers/subscription-paused";
import { subscriptionUnpausedTrigger } from "./lib/triggers/subscription-unpaused";
import { subscriptionPaymentSuccessTrigger } from "./lib/triggers/subscription-payment-success";
import { subscriptionPaymentFailedTrigger } from "./lib/triggers/subscription-payment-failed";
import { subscriptionPaymentRecoveredTrigger } from "./lib/triggers/subscription-payment-recovered";
import { subscriptionPaymentRefundedTrigger } from "./lib/triggers/subscription-payment-refunded";
import { licenseKeyCreatedTrigger } from "./lib/triggers/license-key-created";
import { licenseKeyUpdatedTrigger } from "./lib/triggers/license-key-updated";
import { affiliateActivatedTrigger } from "./lib/triggers/affiliate-activated";

export const lemonSqueezy = createPiece({
  displayName: "Lemon Squeezy",
  auth: lemonSqueezyAuth,
  description: "Lemon Squeezy is a payment gateway for e-commerce and subscription-based businesses.",
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/lemon-squeezy.png",
  authors: ["onyedikachi-david"],
  actions: [],
  triggers: [
    orderCreatedTrigger,
    orderRefundedTrigger,
    subscriptionCreatedTrigger,
    subscriptionUpdatedTrigger,
    subscriptionCancelledTrigger,
    subscriptionResumedTrigger,
    subscriptionExpiredTrigger,
    subscriptionPausedTrigger,
    subscriptionUnpausedTrigger,
    subscriptionPaymentSuccessTrigger,
    subscriptionPaymentFailedTrigger,
    subscriptionPaymentRecoveredTrigger,
    subscriptionPaymentRefundedTrigger,
    licenseKeyCreatedTrigger,
    licenseKeyUpdatedTrigger,
    affiliateActivatedTrigger
  ],
});
