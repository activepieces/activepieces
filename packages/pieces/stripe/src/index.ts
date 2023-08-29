import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import {stripeNewPayment} from "./lib/trigger/new-payment";
import {stripeNewCustomer} from "./lib/trigger/new-customer";
import {stripePaymentFailed} from "./lib/trigger/payment-failed";
import { stripeNewSubscription } from './lib/trigger/new-subscription';
import { stripeCreateCustomer } from './lib/actions/create-customer';


export const stripeAuth = PieceAuth.CustomAuth({
    description: "API Key acquired from your Stripe dashboard",
    required: true,
    props: {
        publicKey: PieceAuth.SecretText({
            displayName:"Public API Key",
            required:true
        }),
        secretKey: PieceAuth.SecretText({
            displayName:"Secret API Key",
            required:false
        }),
    }
})

export const stripeSecret = PieceAuth.SecretText({
    displayName:"Secret API Key",
    required:false,
    description:"Secret key acquired from your Stripe dashboard, needed to edit records"
})

export const stripe = createPiece({
	displayName: "Stripe",
	    minimumSupportedRelease: '0.5.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/stripe.png',
	authors: ['ashrafsamhouri', 'lldiegon'],
    auth: stripeAuth,
	actions: [stripeCreateCustomer],
	triggers: [stripeNewPayment, stripeNewCustomer, stripePaymentFailed, stripeNewSubscription],
});
