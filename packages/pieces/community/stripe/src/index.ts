import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { stripeCreateCustomer } from './lib/actions/create-customer';
import { stripeCreateInvoice } from './lib/actions/create-invoice';
import { stripeRetrieveCustomer } from './lib/actions/retrieve-customer';
import { stripeSearchCustomer } from './lib/actions/search-customer';
import { stripeNewCustomer } from './lib/triggers/new-customer';
import { stripeNewPayment } from './lib/triggers/new-payment';
import { stripeNewSubscription } from './lib/triggers/new-subscription';
import { stripePaymentFailed } from './lib/triggers/payment-failed';
import { stripeSearchSubscriptions } from './lib/actions/search-subscriptions';
import { cancelSubscription } from './lib/actions/cancel-subscription';
import { createARefund } from './lib/actions/create-a-refund';
import { createPaymentLink } from './lib/actions/create-payment-link';
import { createPayment } from './lib/actions/create-payment';
import { createPrice } from './lib/actions/create-price';
import { createProduct } from './lib/actions/create-product';
import { createSubscription } from './lib/actions/create-subscription';
import { deactivatePaymentLink } from './lib/actions/deactivate-payment-link';
import { findInvoice } from './lib/actions/find-invoice';
import { findPayment } from './lib/actions/find-payment';
import { retrieveAnInvoice } from './lib/actions/retrieve-an-invoice';
import { retrivepayout } from './lib/actions/retrieve-a-payout';
import { updateCustomer } from './lib/actions/update-customer';
import { canceledSubscription } from './lib/triggers/canceled-subscription';
import { checkoutSessionCompleted } from './lib/triggers/checkout-session-completed';
import { invoicePaymentFailed } from './lib/triggers/invoice-payment-failed';
import { newCharge } from './lib/triggers/new-charge';
import { newDispute } from './lib/triggers/new-dispute';
import { newInvoice } from './lib/triggers/new-invoice';
import { newPaymentLink } from './lib/triggers/new-payment-link';
import { newRefund } from './lib/triggers/new-refund';
import { updatedSubscription } from './lib/triggers/updated-subscription';

export const stripeAuth = PieceAuth.SecretText({
  displayName: 'Secret API Key',
  required: true,
  description: 'Secret key acquired from your Stripe dashboard',
});

export const stripe = createPiece({
  displayName: 'Stripe',
  description: 'Online payment processing for internet businesses',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/stripe.png',
  authors: ["lldiegon", "doskyft", "kishanprmr", "MoShizzle", "AbdulTheActivePiecer", "khaledmashaly", "abuaboud"],
  categories: [PieceCategory.COMMERCE, PieceCategory.PAYMENT_PROCESSING],
  auth: stripeAuth,
  actions: [
    cancelSubscription,
    createARefund,
    createPaymentLink,
    createPayment,
    createPrice,
    createProduct,
    createSubscription,
    deactivatePaymentLink,
    findInvoice,
    findPayment,
    retrieveAnInvoice,
    retrivepayout,
    updateCustomer,
    stripeCreateCustomer,
    stripeCreateInvoice,
    stripeSearchCustomer,
    stripeSearchSubscriptions,
    stripeRetrieveCustomer,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.stripe.com/v1',
      auth: stripeAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [
    canceledSubscription,
    checkoutSessionCompleted,
    invoicePaymentFailed,
    newCharge,
    newDispute,
    newInvoice,
    newPaymentLink,
    newRefund,
    updatedSubscription,
    stripeNewPayment,
    stripeNewCustomer,
    stripePaymentFailed,
    stripeNewSubscription,
  ],
});
