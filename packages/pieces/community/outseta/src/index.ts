import { createPiece } from '@activepieces/pieces-framework';
import { outsetaAuth } from './auth';

import { getAccountAction } from './actions/get-account';
import { getPersonAction } from './actions/get-person';
import { getSubscriptionAction } from './actions/get-subscription';

import { accountCreatedTrigger } from './triggers/account-created';
import { accountUpdatedTrigger } from './triggers/account-updated';
import { personCreatedTrigger } from './triggers/person-created';
import { personUpdatedTrigger } from './triggers/person-updated';
import { subscriptionCreatedTrigger } from './triggers/subscription-created';
import { subscriptionUpdatedTrigger } from './triggers/subscription-updated';
import { invoicePaidTrigger } from './triggers/invoice-paid';
import { paymentSucceededTrigger } from './triggers/payment-succeeded';

export const outseta = createPiece({
  name: 'outseta',
  displayName: 'Outseta',
  description: 'Triggers and actions for Outseta CRM and Billing',
  auth: outsetaAuth,
  minimumSupportedRelease: '0.20.0',
  triggers: [
    accountCreatedTrigger,
    accountUpdatedTrigger,
    personCreatedTrigger,
    personUpdatedTrigger,
    subscriptionCreatedTrigger,
    subscriptionUpdatedTrigger,
    invoicePaidTrigger,
    paymentSucceededTrigger,
  ],
  actions: [
    getAccountAction,
    getPersonAction,
    getSubscriptionAction,
  ],
});
