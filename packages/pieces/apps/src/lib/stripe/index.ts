import {createPiece} from '@activepieces/framework';
import {stripeNewPayment} from "./trigger/new-payment";
import {stripeNewCustomer} from "./trigger/new-customer";
import {stripePaymentFailed} from "./trigger/payment-failed";
import { stripeNewSubscription } from './trigger/new-subscription';

export const stripe = createPiece({
	name: 'stripe',
	displayName: "Stripe",
	logoUrl: 'https://cdn.activepieces.com/pieces/stripe.png',
  version: '0.0.0',
	authors: ['ashrafsamhouri'],
	actions: [],
	triggers: [stripeNewPayment, stripeNewCustomer, stripePaymentFailed, stripeNewSubscription],
});
