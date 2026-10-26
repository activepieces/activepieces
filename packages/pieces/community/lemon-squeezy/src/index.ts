import { createPiece } from "@activepieces/pieces-framework";
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { lemonSqueezyAuth } from "./lib/common/auth";
import { LEMON_SQUEEZY_API_BASE } from "./lib/common/client";
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
import { listStores } from "./lib/actions/list-stores";
import { getCustomer } from "./lib/actions/get-customer";
import { findCustomerByEmail } from "./lib/actions/find-customer-by-email";
import { createCustomer } from "./lib/actions/create-customer";
import { updateCustomer } from "./lib/actions/update-customer";
import { getOrderAi } from "./lib/actions/get-order-ai";
import { listOrderItems } from "./lib/actions/list-order-items";
import { generateOrderInvoice } from "./lib/actions/generate-order-invoice";
import { getProduct } from "./lib/actions/get-product";
import { listVariants } from "./lib/actions/list-variants";
import { getSubscription } from "./lib/actions/get-subscription";
import { listSubscriptionsAi } from "./lib/actions/list-subscriptions-ai";
import { cancelSubscription } from "./lib/actions/cancel-subscription";
import { resumeSubscription } from "./lib/actions/resume-subscription";
import { pauseSubscription } from "./lib/actions/pause-subscription";
import { unpauseSubscription } from "./lib/actions/unpause-subscription";
import { changeSubscriptionPlan } from "./lib/actions/change-subscription-plan";
import { listSubscriptionInvoices } from "./lib/actions/list-subscription-invoices";
import { listDiscounts } from "./lib/actions/list-discounts";
import { createDiscount } from "./lib/actions/create-discount";
import { deleteDiscount } from "./lib/actions/delete-discount";
import { getLicenseKey } from "./lib/actions/get-license-key";
import { updateLicenseKey } from "./lib/actions/update-license-key";
import { listLicenseKeys } from "./lib/actions/list-license-keys";
import { getDiscount } from "./lib/actions/get-discount";
import { listLicenseKeyInstances } from "./lib/actions/list-license-key-instances";
import { listAffiliates } from "./lib/actions/list-affiliates";
import { listDiscountRedemptions } from "./lib/actions/list-discount-redemptions";
import { listSubscriptionItems } from "./lib/actions/list-subscription-items";
import { validateLicense } from "./lib/actions/validate-license";

export const lemonSqueezy = createPiece({
  displayName: "Lemon Squeezy",
  auth: lemonSqueezyAuth,
  description: "Lemon Squeezy is a payment gateway for e-commerce and subscription-based businesses.",
  minimumSupportedRelease: '0.88.2',
  logoUrl: "https://cdn.activepieces.com/pieces/lemon-squeezy.png",
  authors: ["onyedikachi-david", "Harmatta"],
  actions: [
    listProducts,
    listOrders,
    getOrder,
    listSubscriptions,
    createCheckout,
    listCustomers,
    listStores,
    getCustomer,
    findCustomerByEmail,
    createCustomer,
    updateCustomer,
    getOrderAi,
    listOrderItems,
    generateOrderInvoice,
    getProduct,
    listVariants,
    getSubscription,
    listSubscriptionsAi,
    cancelSubscription,
    resumeSubscription,
    pauseSubscription,
    unpauseSubscription,
    changeSubscriptionPlan,
    listSubscriptionInvoices,
    listDiscounts,
    createDiscount,
    deleteDiscount,
    getLicenseKey,
    updateLicenseKey,
    listLicenseKeys,
    getDiscount,
    listLicenseKeyInstances,
    listAffiliates,
    listDiscountRedemptions,
    listSubscriptionItems,
    validateLicense,
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
