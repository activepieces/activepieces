import {createPiece} from '../../framework/piece';
import {stripeNewPayment} from "./trigger/new-payment";
import {stripeNewCustomer} from "./trigger/new-customer";

export const stripe = createPiece({
	name: 'stripe',
	displayName: "Stripe",
	logoUrl: 'https://cdn.activepieces.com/pieces/stripe.png',
	actions: [],
	triggers: [stripeNewPayment, stripeNewCustomer],
});
