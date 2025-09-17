import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';


import { stripeCreateCustomer } from './lib/actions/create-customer';
import { stripeCreateInvoice } from './lib/actions/create-invoice';
import { stripeRetrieveCustomer } from './lib/actions/retrieve-customer';
import { stripeSearchCustomer } from './lib/actions/search-customer';
import { stripeSearchSubscriptions } from './lib/actions/search-subscriptions';
import { stripeUpdateCustomer } from './lib/actions/update-customer';
import { stripeCreatePayment } from './lib/actions/create-payment';
import { stripeCreateProduct } from './lib/actions/create-product';
import { stripeCreatePrice } from './lib/actions/create-price';
import { stripeCreateSubscription } from './lib/actions/create-subscription';
import { stripeCancelSubscription } from './lib/actions/cancel-subscription';
import { stripeRetrieveInvoice } from './lib/actions/retrieve-invoice';
import { stripeRetrievePayout } from './lib/actions/retrieve-payout';
import { stripeCreateRefund } from './lib/actions/create-refund';
import { stripeCreatePaymentLink } from './lib/actions/create-payment-link';
import { stripeDeactivatePaymentLink } from './lib/actions/deactivate-payment-link';
import { stripeFindPayment } from './lib/actions/find-payment';
import { stripeFindInvoice } from './lib/actions/find-invoice';


import { stripeNewCustomer } from './lib/trigger/new-customer';
import { stripeNewPayment } from './lib/trigger/new-payment';
import { stripeNewSubscription } from './lib/trigger/new-subscription';
import { stripePaymentFailed } from './lib/trigger/payment-failed';
import { stripeNewCharge } from './lib/trigger/new-charge';
import { stripeNewInvoice } from './lib/trigger/new-invoice';
import { stripeInvoicePaymentFailed } from './lib/trigger/invoice-payment-failed';
import { stripeCanceledSubscription } from './lib/trigger/canceled-subscription';
import { stripeNewRefund } from './lib/trigger/new-refund';
import { stripeNewDispute } from './lib/trigger/new-dispute';
import { stripeNewPaymentLink } from './lib/trigger/new-payment-link';
import { stripeUpdatedSubscription } from './lib/trigger/updated-subscription';
import { stripeCheckoutSessionCompleted } from './lib/trigger/checkout-session-completed';


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
        stripeUpdateCustomer,
        stripeCreateProduct,
        stripeCreatePrice,
        stripeCreateInvoice,
        stripeCreateSubscription,
        stripeCancelSubscription,
        stripeCreatePayment,
        stripeCreatePaymentLink,
        stripeDeactivatePaymentLink,
        stripeCreateRefund,
        stripeRetrieveCustomer,
        stripeRetrieveInvoice,
        stripeRetrievePayout,
        stripeSearchCustomer,
        stripeSearchSubscriptions,
        stripeFindPayment,
        stripeFindInvoice,
        createCustomApiCallAction({
            baseUrl: () => 'https://api.stripe.com/v1',
            auth: stripeAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth}`,
            }),
        }),
    ],
    triggers: [
        stripeNewCustomer,
        stripeNewCharge,
        stripeNewInvoice,
        stripeInvoicePaymentFailed,
        stripeNewSubscription,
        stripeUpdatedSubscription,
        stripeCanceledSubscription,
        stripeNewPayment,
        stripePaymentFailed,
        stripeNewRefund,
        stripeNewDispute,
        stripeNewPaymentLink,
        stripeCheckoutSessionCompleted,
    ],
});