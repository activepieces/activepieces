import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { stripeCreateCustomer } from './lib/actions/create-customer';
import { stripeCreateInvoice } from './lib/actions/create-invoice';
import { stripeRetrieveCustomer } from './lib/actions/retrieve-customer';
import { stripeSearchCustomer } from './lib/actions/search-customer';
import { stripeNewCustomer } from './lib/trigger/new-customer';
import { stripeNewPayment } from './lib/trigger/new-payment';
import { stripeNewSubscription } from './lib/trigger/new-subscription';
import { stripePaymentFailed } from './lib/trigger/payment-failed';

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
  authors: ["lldiegon","doskyft","kishanprmr","MoShizzle","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  categories: [PieceCategory.COMMERCE, PieceCategory.PAYMENT_PROCESSING],
  auth: stripeAuth,
  actions: [
    stripeCreateCustomer,
    stripeCreateInvoice,
    stripeSearchCustomer,
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
    stripeNewPayment,
    stripeNewCustomer,
    stripePaymentFailed,
    stripeNewSubscription,
  ],
});
