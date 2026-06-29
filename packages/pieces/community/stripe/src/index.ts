import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { stripeCreateCustomer } from './lib/actions/create-customer';
import { stripeCreateInvoice } from './lib/actions/create-invoice';
import { stripeRetrieveCustomer } from './lib/actions/retrieve-customer';
import { stripeSearchCustomer } from './lib/actions/search-customer';
import { stripeNewCustomer } from './lib/trigger/new-customer';
import { stripeNewPayment } from './lib/trigger/new-payment';
import { stripeNewSubscription } from './lib/trigger/new-subscription';
import { stripePaymentFailed } from './lib/trigger/payment-failed';
import { stripeSearchSubscriptions } from './lib/actions/search-subscriptions';
import { stripeNewCharge } from './lib/trigger/new-charge';
import { stripeNewInvoice } from './lib/trigger/new-invoice';
import { stripeInvoicePaymentFailed } from './lib/trigger/invoice-payment-failed';
import { stripeCanceledSubscription } from './lib/trigger/canceled-subscription';
import { stripeNewRefund } from './lib/trigger/new-refund';
import { stripeNewDispute } from './lib/trigger/new-dispute';
import { stripeNewPaymentLink } from './lib/trigger/new-payment-link';
import { stripeUpdatedSubscription } from './lib/trigger/updated-subscription';
import { stripeCheckoutSessionCompleted } from './lib/trigger/checkout-session-completed';
import { stripeUpdateCustomer } from './lib/actions/update-customer';
import { stripeCreatePaymentIntent } from './lib/actions/create-payment-intent';
import { stripeCreateProduct } from './lib/actions/create-product';
import { stripeCreatePrice } from './lib/actions/create-price';
import { stripeCreateSubscription } from './lib/actions/create-subscription';
import { stripeCancelSubscription } from './lib/actions/cancel-subscription';
import { stripeRetrieveInvoice } from './lib/actions/retrieve-invoice';
import { stripeRetrievePayout } from './lib/actions/retrieve-payout';
import { stripeCreateRefund } from './lib/actions/create-refund';
import { stripeCreatePaymentLink } from './lib/actions/create-payment-link';
import { stripeDeactivatePaymentLink } from './lib/actions/deactivate-payment-link';
import { stripeRetrievePaymentIntent } from './lib/actions/retrieve-payment-intent';
import { stripeFindInvoice } from './lib/actions/find-invoice';
import { stripeCreateCustomerAi } from './lib/actions/create-customer-ai';
import { stripeGetCustomer } from './lib/actions/get-customer';
import { stripeUpdateCustomerAi } from './lib/actions/update-customer-ai';
import { stripeSearchCustomers } from './lib/actions/search-customers';
import { stripeCreatePaymentIntentAi } from './lib/actions/create-payment-intent-ai';
import { stripeGetPaymentIntent } from './lib/actions/get-payment-intent';
import { stripeCreateRefundAi } from './lib/actions/create-refund-ai';
import { stripeCreateInvoiceAi } from './lib/actions/create-invoice-ai';
import { stripeGetInvoice } from './lib/actions/get-invoice';
import { stripeCreateProductAi } from './lib/actions/create-product-ai';
import { stripeCreatePriceAi } from './lib/actions/create-price-ai';
import { stripeCreateSubscriptionAi } from './lib/actions/create-subscription-ai';
import { stripeCancelSubscriptionAi } from './lib/actions/cancel-subscription-ai';
import { stripeSearchSubscriptionsAi } from './lib/actions/search-subscriptions-ai';
import { stripeCreatePaymentLinkAi } from './lib/actions/create-payment-link-ai';
import { stripeDeactivatePaymentLinkAi } from './lib/actions/deactivate-payment-link-ai';
import { stripeGetPayout } from './lib/actions/get-payout';
import { stripeListCustomers } from './lib/actions/list-customers';
import { stripeConfirmPaymentIntent } from './lib/actions/confirm-payment-intent';
import { stripeCancelPaymentIntent } from './lib/actions/cancel-payment-intent';
import { stripeCapturePaymentIntent } from './lib/actions/capture-payment-intent';
import { stripeListPaymentIntents } from './lib/actions/list-payment-intents';
import { stripeSearchPaymentIntents } from './lib/actions/search-payment-intents';
import { stripeRetrieveCharge } from './lib/actions/retrieve-charge';
import { stripeListCharges } from './lib/actions/list-charges';
import { stripeSearchCharges } from './lib/actions/search-charges';
import { stripeGetRefund } from './lib/actions/get-refund';
import { stripeListRefunds } from './lib/actions/list-refunds';
import { stripeListInvoices } from './lib/actions/list-invoices';
import { stripeSearchInvoices } from './lib/actions/search-invoices';
import { stripeFinalizeInvoice } from './lib/actions/finalize-invoice';
import { stripeSendInvoice } from './lib/actions/send-invoice';
import { stripeAddInvoiceLines } from './lib/actions/add-invoice-lines';
import { stripeListInvoiceLines } from './lib/actions/list-invoice-lines';
import { stripeCreateInvoiceItem } from './lib/actions/create-invoice-item';
import { stripeUpdateProduct } from './lib/actions/update-product';
import { stripeGetProduct } from './lib/actions/get-product';
import { stripeListProducts } from './lib/actions/list-products';
import { stripeSearchProducts } from './lib/actions/search-products';
import { stripeUpdatePrice } from './lib/actions/update-price';
import { stripeGetPrice } from './lib/actions/get-price';
import { stripeListPrices } from './lib/actions/list-prices';
import { stripeSearchPrices } from './lib/actions/search-prices';
import { stripeUpdateSubscription } from './lib/actions/update-subscription';
import { stripeGetSubscription } from './lib/actions/get-subscription';
import { stripeListSubscriptions } from './lib/actions/list-subscriptions';
import { stripeListSubscriptionItems } from './lib/actions/list-subscription-items';
import { stripeGetPaymentLink } from './lib/actions/get-payment-link';
import { stripeListPaymentLinks } from './lib/actions/list-payment-links';
import { stripeCreateCheckoutSession } from './lib/actions/create-checkout-session';
import { stripeGetCheckoutSession } from './lib/actions/get-checkout-session';
import { stripeListCheckoutSessions } from './lib/actions/list-checkout-sessions';
import { stripeCreatePaymentMethod } from './lib/actions/create-payment-method';
import { stripeAttachPaymentMethod } from './lib/actions/attach-payment-method';
import { stripeGetPaymentMethod } from './lib/actions/get-payment-method';
import { stripeListCustomerPaymentMethods } from './lib/actions/list-customer-payment-methods';
import { stripeCreateCoupon } from './lib/actions/create-coupon';
import { stripeGetCoupon } from './lib/actions/get-coupon';
import { stripeListCoupons } from './lib/actions/list-coupons';
import { stripeCreatePromotionCode } from './lib/actions/create-promotion-code';
import { stripeGetPromotionCode } from './lib/actions/get-promotion-code';
import { stripeListPromotionCodes } from './lib/actions/list-promotion-codes';
import { stripeRetrieveBalance } from './lib/actions/retrieve-balance';
import { stripeListBalanceTransactions } from './lib/actions/list-balance-transactions';
import { stripeListPayouts } from './lib/actions/list-payouts';
import { stripeCreateTaxRate } from './lib/actions/create-tax-rate';
import { stripeGetTaxRate } from './lib/actions/get-tax-rate';
import { stripeListTaxRates } from './lib/actions/list-tax-rates';
import { stripeCreateCreditNote } from './lib/actions/create-credit-note';
import { stripeVoidCreditNote } from './lib/actions/void-credit-note';
import { stripeGetCreditNote } from './lib/actions/get-credit-note';
import { stripeListCreditNotes } from './lib/actions/list-credit-notes';
import { stripeListEvents } from './lib/actions/list-events';
import { stripeGetEvent } from './lib/actions/get-event';
import { stripeGetDispute } from './lib/actions/get-dispute';
import { stripeListDisputes } from './lib/actions/list-disputes';
import { stripeListTransfers } from './lib/actions/list-transfers';
import { stripeUpdateDispute } from './lib/actions/update-dispute';
import { stripeCloseDispute } from './lib/actions/close-dispute';

export const stripeAuth = PieceAuth.SecretText({
  displayName: 'Secret API Key',
  required: true,
  description: 'Secret key acquired from your Stripe dashboard',
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.stripe.com/v1/customers`,
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key. Please check the key and try again.',
      };
    }
  },
});

export const stripe = createPiece({
  displayName: 'Stripe',
  description: 'Online payment processing for internet businesses',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/stripe.png',
  authors: [
    'lldiegon',
    'doskyft',
    'kishanprmr',
    'MoShizzle',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
    'Prabhukiran161',
    'sanket-a11y',
  ],
  categories: [PieceCategory.COMMERCE, PieceCategory.PAYMENT_PROCESSING],
  auth: stripeAuth,
  actions: [
    stripeCreateCustomer,
    stripeCreateInvoice,
    stripeSearchCustomer,
    stripeSearchSubscriptions,
    stripeRetrieveCustomer,
    stripeUpdateCustomer,
    stripeCreatePaymentIntent,
    stripeCreateProduct,
    stripeCreatePrice,
    stripeCreateSubscription,
    stripeCancelSubscription,
    stripeRetrieveInvoice,
    stripeRetrievePayout,
    stripeCreateRefund,
    stripeCreatePaymentLink,
    stripeDeactivatePaymentLink,
    stripeRetrievePaymentIntent,
    stripeFindInvoice,
    stripeCreateCustomerAi,
    stripeGetCustomer,
    stripeUpdateCustomerAi,
    stripeSearchCustomers,
    stripeCreatePaymentIntentAi,
    stripeGetPaymentIntent,
    stripeCreateRefundAi,
    stripeCreateInvoiceAi,
    stripeGetInvoice,
    stripeCreateProductAi,
    stripeCreatePriceAi,
    stripeCreateSubscriptionAi,
    stripeCancelSubscriptionAi,
    stripeSearchSubscriptionsAi,
    stripeCreatePaymentLinkAi,
    stripeDeactivatePaymentLinkAi,
    stripeGetPayout,
    stripeListCustomers,
    stripeConfirmPaymentIntent,
    stripeCancelPaymentIntent,
    stripeCapturePaymentIntent,
    stripeListPaymentIntents,
    stripeSearchPaymentIntents,
    stripeRetrieveCharge,
    stripeListCharges,
    stripeSearchCharges,
    stripeGetRefund,
    stripeListRefunds,
    stripeListInvoices,
    stripeSearchInvoices,
    stripeFinalizeInvoice,
    stripeSendInvoice,
    stripeAddInvoiceLines,
    stripeListInvoiceLines,
    stripeCreateInvoiceItem,
    stripeUpdateProduct,
    stripeGetProduct,
    stripeListProducts,
    stripeSearchProducts,
    stripeUpdatePrice,
    stripeGetPrice,
    stripeListPrices,
    stripeSearchPrices,
    stripeUpdateSubscription,
    stripeGetSubscription,
    stripeListSubscriptions,
    stripeListSubscriptionItems,
    stripeGetPaymentLink,
    stripeListPaymentLinks,
    stripeCreateCheckoutSession,
    stripeGetCheckoutSession,
    stripeListCheckoutSessions,
    stripeCreatePaymentMethod,
    stripeAttachPaymentMethod,
    stripeGetPaymentMethod,
    stripeListCustomerPaymentMethods,
    stripeCreateCoupon,
    stripeGetCoupon,
    stripeListCoupons,
    stripeCreatePromotionCode,
    stripeGetPromotionCode,
    stripeListPromotionCodes,
    stripeRetrieveBalance,
    stripeListBalanceTransactions,
    stripeListPayouts,
    stripeCreateTaxRate,
    stripeGetTaxRate,
    stripeListTaxRates,
    stripeCreateCreditNote,
    stripeVoidCreditNote,
    stripeGetCreditNote,
    stripeListCreditNotes,
    stripeListEvents,
    stripeGetEvent,
    stripeGetDispute,
    stripeListDisputes,
    stripeListTransfers,
    stripeUpdateDispute,
    stripeCloseDispute,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.stripe.com/v1',
      auth: stripeAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [
    stripeNewPayment,
    stripeNewCustomer,
    stripePaymentFailed,
    stripeNewSubscription,
    stripeNewCharge,
    stripeNewInvoice,
    stripeInvoicePaymentFailed,
    stripeCanceledSubscription,
    stripeNewRefund,
    stripeNewDispute,
    stripeNewPaymentLink,
    stripeUpdatedSubscription,
    stripeCheckoutSessionCompleted,
  ],
});
