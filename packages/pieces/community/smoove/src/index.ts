import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework';
import { smooveAuth } from './lib/common/auth';
import { createListAction } from './lib/actions/create-list';
import { findSubscriberAction } from './lib/actions/find-subscriber';
import { unsubscribeContactAction } from './lib/actions/unsubscribe-contact';
import { newSubscriberTrigger } from './lib/triggers/new-subscriber';
import { newListCreatedTrigger } from './lib/triggers/new-list-created-trigger';

export const smoove = createPiece({
  displayName: 'Smoove',
  auth: smooveAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/smoove.png',
  authors: ['aryel780'],
  actions: [
    createListAction,
    findSubscriberAction,
    unsubscribeContactAction,
    createCustomApiCallAction({
      auth: smooveAuth,
      baseUrl: () => 'https://rest.smoove.io/v1',
      authMapping: async (auth: unknown) => {
        const { apiKey } = auth as { apiKey: string };
        return {
          Authorization: `Bearer ${apiKey}`,
        };
      },
    }),
  ],
  triggers: [newSubscriberTrigger, newListCreatedTrigger],
});
