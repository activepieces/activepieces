import { createCustomApiCallAction, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { stripeCancelSubscription } from './lib/actions/cancel-subscription'
import { stripeCreateCustomer } from './lib/actions/create-customer'
import { stripeCreateInvoice } from './lib/actions/create-invoice'
import { stripeCreatePaymentIntent } from './lib/actions/create-payment-intent'
import { stripeCreatePaymentLink } from './lib/actions/create-payment-link'
import { stripeCreatePrice } from './lib/actions/create-price'
import { stripeCreateProduct } from './lib/actions/create-product'
import { stripeCreateRefund } from './lib/actions/create-refund'
import { stripeCreateSubscription } from './lib/actions/create-subscription'
import { stripeDeactivatePaymentLink } from './lib/actions/deactivate-payment-link'
import { stripeFindInvoice } from './lib/actions/find-invoice'
import { stripeRetrieveCustomer } from './lib/actions/retrieve-customer'
import { stripeRetrieveInvoice } from './lib/actions/retrieve-invoice'
import { stripeRetrievePaymentIntent } from './lib/actions/retrieve-payment-intent'
import { stripeRetrievePayout } from './lib/actions/retrieve-payout'
import { stripeSearchCustomer } from './lib/actions/search-customer'
import { stripeSearchSubscriptions } from './lib/actions/search-subscriptions'
import { stripeUpdateCustomer } from './lib/actions/update-customer'
import { stripeCanceledSubscription } from './lib/trigger/canceled-subscription'
import { stripeCheckoutSessionCompleted } from './lib/trigger/checkout-session-completed'
import { stripeInvoicePaymentFailed } from './lib/trigger/invoice-payment-failed'
import { stripeNewCharge } from './lib/trigger/new-charge'
import { stripeNewCustomer } from './lib/trigger/new-customer'
import { stripeNewDispute } from './lib/trigger/new-dispute'
import { stripeNewInvoice } from './lib/trigger/new-invoice'
import { stripeNewPayment } from './lib/trigger/new-payment'
import { stripeNewPaymentLink } from './lib/trigger/new-payment-link'
import { stripeNewRefund } from './lib/trigger/new-refund'
import { stripeNewSubscription } from './lib/trigger/new-subscription'
import { stripePaymentFailed } from './lib/trigger/payment-failed'
import { stripeUpdatedSubscription } from './lib/trigger/updated-subscription'

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
            })
            return {
                valid: true,
            }
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid API Key. Please check the key and try again.',
            }
        }
    },
})

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
})
