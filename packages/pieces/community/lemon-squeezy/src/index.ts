import { createPiece } from "@activepieces/pieces-framework";
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { lemonSqueezyAuth } from "./lib/common/auth";
import { LEMON_SQUEEZY_API_BASE } from "./lib/common/api";
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
import { listProducts } from "./lib/actions/list-products";
import { listOrders } from "./lib/actions/list-orders";
import { getOrder } from "./lib/actions/get-order";
import { listSubscriptions } from "./lib/actions/list-subscriptions";
import { createCheckout } from "./lib/actions/create-checkout";
import { listCustomers } from "./lib/actions/list-customers";

export const lemonSqueezy = createPiece({
  displayName: "Lemon Squeezy",
  auth: lemonSqueezyAuth,
  description: "Lemon Squeezy is a payment gateway for e-commerce and subscription-based businesses.",
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/lemon-squeezy.png",
  authors: ["onyedikachi-david", "Harmatta"],
  actions: [
    listProducts,
    listOrders,
    getOrder,
    listSubscriptions,
    createCheckout,
    listCustomers,
    createCustomApiCallAction({
      auth: lemonSqueezyAuth,
      baseUrl: () => LEMON_SQUEEZY_API_BASE,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      }),
    }),
  ],
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
    affiliateActivatedTrigger,
  ],
});
