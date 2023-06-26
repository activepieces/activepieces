import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import {stripeNewPayment} from "./lib/trigger/new-payment";
import {stripeNewCustomer} from "./lib/trigger/new-customer";
import {stripePaymentFailed} from "./lib/trigger/payment-failed";
import { stripeNewSubscription } from './lib/trigger/new-subscription';

export const stripeAuth = PieceAuth.SecretText({
    displayName:"API Key",
    required:true,
    description:"API key acquired from your Stripe dashboard"
})

export const stripe = createPiece({
	displayName: "Stripe",
	logoUrl: 'https://cdn.activepieces.com/pieces/stripe.png',
	authors: ['ashrafsamhouri'],
    auth: stripeAuth,
	actions: [],
	triggers: [stripeNewPayment, stripeNewCustomer, stripePaymentFailed, stripeNewSubscription],
});
