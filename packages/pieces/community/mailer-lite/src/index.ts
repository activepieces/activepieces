import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createOrUpdateSubscriber } from './lib/actions/create-or-update-subscription';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { triggers } from './triggers/triggers';
import { addSubscriberToGroupAction } from './lib/actions/add-subscriber-to-group';
import { removeSubscriberFromGroupAction } from './lib/actions/remove-subscriber-from-group';
import { findSubscriberAction } from './lib/actions/find-subscriber';
import { createGroupAction } from './lib/actions/create-group';
import { deleteSubscriberAction } from './lib/actions/delete-subscriber';
import { listGroupSubscribersAction } from './lib/actions/list-group-subscribers';
import { listGroupsAction } from './lib/actions/list-groups';
import { listSubscribersAction } from './lib/actions/list-subscribers';
import { unsubscribeSubscriberAction } from './lib/actions/unsubscribe-subscriber';
import { mailerLiteAuth } from './lib/auth';

export { mailerLiteAuth };

export const mailerLite = createPiece({
  displayName: 'MailerLite',
  description: 'Email marketing software',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mailer-lite.png',
  categories: [PieceCategory.MARKETING],
  authors: ["Willianwg","kanarelo","kishanprmr","khaledmashaly","abuaboud"],
  auth: mailerLiteAuth,
  actions: [
    addSubscriberToGroupAction,
    createOrUpdateSubscriber,
    findSubscriberAction,
    removeSubscriberFromGroupAction,
    listSubscribersAction,
    unsubscribeSubscriberAction,
    deleteSubscriberAction,
    listGroupsAction,
    createGroupAction,
    listGroupSubscribersAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://connect.mailerlite.com/',
      auth: mailerLiteAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers,
});
