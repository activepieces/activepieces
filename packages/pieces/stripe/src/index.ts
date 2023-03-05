import packageJson from '../package.json';
import { createPiece } from '@activepieces/framework';
import {stripeNewPayment} from "./lib/trigger/new-payment";
import {stripeNewCustomer} from "./lib/trigger/new-customer";
import {stripePaymentFailed} from "./lib/trigger/payment-failed";
import { stripeNewSubscription } from './lib/trigger/new-subscription';

export const stripe = createPiece({
	name: 'stripe',
	displayName: "Stripe",
	logoUrl: 'https://cdn.activepieces.com/pieces/stripe.png',
  version: packageJson.version,
	authors: ['ashrafsamhouri'],
	actions: [],
	triggers: [stripeNewPayment, stripeNewCustomer, stripePaymentFailed, stripeNewSubscription],
});
