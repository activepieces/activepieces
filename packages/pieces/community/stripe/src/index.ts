import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { stripeNewPayment } from './lib/trigger/new-payment';
import { stripeNewCustomer } from './lib/trigger/new-customer';
import { stripePaymentFailed } from './lib/trigger/payment-failed';
import { stripeNewSubscription } from './lib/trigger/new-subscription';
import { stripeCreateCustomer } from './lib/actions/create-customer';
import { stripeCreateInvoice } from './lib/actions/create-invoice';
import { stripeSearchCustomer } from './lib/actions/search-customer';
import { stripeRetrieveCustomer } from './lib/actions/retrieve-customer';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const stripeAuth = PieceAuth.SecretText({
  displayName: 'Secret API Key',
  required: true,
  description: 'Secret key acquired from your Stripe dashboard',
});

export const stripe = createPiece({
  displayName: 'Stripe',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/stripe.png',
  authors: ['ashrafsamhouri', 'lldiegon', 'doskyft'],
  auth: stripeAuth,
  actions: [
    stripeCreateCustomer,
    stripeCreateInvoice,
    stripeSearchCustomer,
    stripeRetrieveCustomer,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.stripe.com/v1',
      auth: stripeAuth,
      authMapping: (auth) => ({
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
