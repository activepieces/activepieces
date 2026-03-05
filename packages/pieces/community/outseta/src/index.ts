import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { outsetaAuth } from './auth';

import { getAccountAction } from './action/get-account';
import { getPersonAction } from './action/get-person';
import { getSubscriptionAction } from './action/get-subscription';

import { accountCreatedTrigger } from './triggers/account-created';
import { accountUpdatedTrigger } from './triggers/account-updated';
import { personCreatedTrigger } from './triggers/person-created';
import { personUpdatedTrigger } from './triggers/person-updated';
import { subscriptionCreatedTrigger } from './triggers/subscription-created';
import { subscriptionUpdatedTrigger } from './triggers/subscription-updated';
import { invoicePaidTrigger } from './triggers/invoice-paid';
import { paymentSucceededTrigger } from './triggers/payment-succeeded';

export const outseta = createPiece({
  displayName: 'Outseta',
  description: 'Triggers and actions for Outseta CRM and Billing',
  auth: outsetaAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/outseta.png',
  authors: ['bst1n','sanket-a11y'],
  categories: [PieceCategory.SALES_AND_CRM],
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
    createCustomApiCallAction({
      auth: outsetaAuth,
      baseUrl: (auth) => `${auth.props.domain}/api/v1`,
      authMapping: async (auth) => {
        const { apiKey, apiSecret } = auth.props;
        return {
          Authorization: `Outseta ${apiKey}:${apiSecret}`,
        };
      },
    }),
  ],
});
