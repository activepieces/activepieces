import {
  createCustomApiCallAction,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { sendpulseAuth } from './lib/common/auth';
import { sendpulseApiCall } from './lib/common/client';
import { newSubscriberTrigger } from './lib/triggers/new-subscriber';
import { newUnsubscriberTrigger } from './lib/triggers/new-unsubscriber';
import { updatedSubscriberTrigger } from './lib/triggers/updated-subscriber';
import { addSubscriberAction } from './lib/actions/add-subscriber';
import { changeVariableForSubscriberAction } from './lib/actions/change-variable-for-subscriber';
import { deleteContactAction } from './lib/actions/delete-contact';
import { unsubscribeUserAction } from './lib/actions/unsubscribe-user';
import { updateSubscriberAction } from './lib/actions/update-subscriber';

export const sendpulse = createPiece({
  displayName: 'SendPulse',
  auth: sendpulseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/sendpulse.png',
  authors: ['aryel780', 'onyedikachi-david'],
  actions: [
    addSubscriberAction,
    changeVariableForSubscriberAction,
    deleteContactAction,
    unsubscribeUserAction,
    updateSubscriberAction,
    createCustomApiCallAction({
      auth: sendpulseAuth,
      baseUrl: () => 'https://api.sendpulse.com',
      authMapping: async (auth) => {
        const typedAuth = auth as { clientId: string; clientSecret: string };
        const token = await sendpulseApiCall<{ access_token: string }>({
          method: HttpMethod.POST,
          auth: typedAuth,
          resourceUri: '/oauth/access_token',
          body: {
            grant_type: 'client_credentials',
            client_id: typedAuth.clientId,
            client_secret: typedAuth.clientSecret,
          },
        });

        return {
          Authorization: `Bearer ${token.access_token}`,
        };
      },
    }),
  ],
  triggers: [
    newSubscriberTrigger,
    newUnsubscriberTrigger,
    updatedSubscriberTrigger
  ],
});

    