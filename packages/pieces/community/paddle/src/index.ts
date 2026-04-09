import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { cancelSubscriptionAction } from './lib/actions/cancel-subscription';
import { createTransactionAction } from './lib/actions/create-transaction';
import { getSubscriptionAction } from './lib/actions/get-subscription';
import { listCustomersAction } from './lib/actions/list-customers';
import { updateSubscriptionAction } from './lib/actions/update-subscription';
import { paddleAuth } from './lib/auth';
import { paddleClient } from './lib/common/client';
import { newActiveSubscription } from './lib/triggers/new-active-subscription';
import { paymentFailed } from './lib/triggers/payment-failed';
import { subscriptionCanceled } from './lib/triggers/subscription-canceled';
import { subscriptionPastDue } from './lib/triggers/subscription-past-due';
import { transactionCompleted } from './lib/triggers/transaction-completed';

const paddle = createPiece({
  displayName: 'Paddle',
  description:
    'Manage customers, subscriptions, and recurring billing with Paddle Billing.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/paddle.png',
  categories: [PieceCategory.COMMERCE, PieceCategory.PAYMENT_PROCESSING],
  authors: ['veri5ied'],
  auth: paddleAuth,
  actions: [
    listCustomersAction,
    getSubscriptionAction,
    updateSubscriptionAction,
    cancelSubscriptionAction,
    createTransactionAction,
    createCustomApiCallAction({
      auth: paddleAuth,
      baseUrl: (auth) =>
        auth
          ? paddleClient.getBaseUrl({ apiKey: auth.secret_text })
          : paddleClient.getBaseUrl({ apiKey: '' }),
      authMapping: async (auth) => ({
        Accept: 'application/json',
        Authorization: `Bearer ${auth.secret_text}`,
        'Content-Type': 'application/json',
        'Paddle-Version': '1',
      }),
    }),
  ],
  triggers: [
    newActiveSubscription,
    subscriptionCanceled,
    subscriptionPastDue,
    transactionCompleted,
    paymentFailed,
  ],
});

export { paddle };
