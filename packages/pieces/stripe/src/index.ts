import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import {stripeNewPayment} from "./lib/trigger/new-payment";
import {stripeNewCustomer} from "./lib/trigger/new-customer";
import {stripePaymentFailed} from "./lib/trigger/payment-failed";
import { stripeNewSubscription } from './lib/trigger/new-subscription';
import { stripeCreateCustomer } from './lib/actions/create-customer';
import { stripeCreateInvoice } from './lib/actions/create-invoice';
import { stripeSearchCustomer } from './lib/actions/search-customer';


export const stripeAuth = PieceAuth.SecretText({
    displayName:"Secret API Key",
    required:true,
    description:"Secret key acquired from your Stripe dashboard"
})

export const stripe = createPiece({
	displayName: "Stripe",
	    minimumSupportedRelease: '0.5.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/stripe.png',
	authors: ['ashrafsamhouri', 'lldiegon'],
    auth: stripeAuth,
	actions: [stripeCreateCustomer, stripeCreateInvoice, stripeSearchCustomer],
	triggers: [stripeNewPayment, stripeNewCustomer, stripePaymentFailed, stripeNewSubscription],
});
