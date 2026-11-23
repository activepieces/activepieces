import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { sendpulseAuth } from './lib/common/auth';
import { getAccessToken, SENDPULSE_BASE_URL } from './lib/common/client';
import { newSubscriberTrigger } from './lib/triggers/new-subscriber';
import { newUnsubscriberTrigger } from './lib/triggers/new-unsubscriber';
import { updatedSubscriberTrigger } from './lib/triggers/updated-subscriber';
import { addSubscriberAction } from './lib/actions/add-subscriber';
import { changeVariableForSubscriberAction } from './lib/actions/change-variable-for-subscriber';
import { deleteContactAction } from './lib/actions/delete-contact';
import { unsubscribeUserAction } from './lib/actions/unsubscribe-user';
import { updateSubscriberAction } from './lib/actions/update-subscriber';
import { listMailingListsAction } from './lib/actions/list-mailing-lists';
import { listMailingListContactsAction } from './lib/actions/list-mailing-list-contacts';
import { getContactAction } from './lib/actions/get-contact';
import { listMailingListVariablesAction } from './lib/actions/list-mailing-list-variables';
import { listSendersAction } from './lib/actions/list-senders';

export const sendpulse = createPiece({
  displayName: 'SendPulse',
  auth: sendpulseAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/sendpulse.png',
  authors: ['aryel780', 'onyedikachi-david'],
  actions: [
    addSubscriberAction,
    changeVariableForSubscriberAction,
    deleteContactAction,
    unsubscribeUserAction,
    updateSubscriberAction,
    listMailingListsAction,
    listMailingListContactsAction,
    getContactAction,
    listMailingListVariablesAction,
    listSendersAction,
    createCustomApiCallAction({
      auth: sendpulseAuth,
      baseUrl: () => SENDPULSE_BASE_URL,
      authMapping: async (auth) => {
        const token = await getAccessToken({ auth: auth.props, useCache: true });
        return {
          Authorization: `Bearer ${token}`,
        };
      },
    }),
  ],
  triggers: [
    newSubscriberTrigger,
    newUnsubscriberTrigger,
    updatedSubscriberTrigger,
  ],
});
