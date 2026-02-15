import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { klaviyoCreateProfile } from './lib/actions/create-profile';
import { klaviyoUpdateProfile } from './lib/actions/update-profile';
import { klaviyoSubscribeProfile } from './lib/actions/subscribe-profile';
import { klaviyoUnsubscribeProfile } from './lib/actions/unsubscribe-profile';
import { klaviyoAddProfileToList } from './lib/actions/add-profile-to-list';
import { klaviyoRemoveProfileFromList } from './lib/actions/remove-profile-from-list';
import { klaviyoCreateList } from './lib/actions/create-list';
import { klaviyoFindProfileByEmailOrPhone } from './lib/actions/find-profile';
import { klaviyoFindListByName } from './lib/actions/find-list';
import { klaviyoFindTagByName } from './lib/actions/find-tag';
import { klaviyoNewProfileTrigger } from './lib/triggers/new-profile';
import { klaviyoProfileAddedToListTrigger } from './lib/triggers/profile-added-to-list';

export const klaviyoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Klaviyo private API key. You can create one from Settings > API Keys in your Klaviyo account.',
  required: true,
});

export const klaviyo = createPiece({
  displayName: 'Klaviyo',
  description: 'Marketing automation platform for email, SMS, and customer data.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/klaviyo.png',
  categories: [PieceCategory.MARKETING],
  authors: ['Crazy-D1359'],
  auth: klaviyoAuth,
  actions: [
    klaviyoCreateProfile,
    klaviyoUpdateProfile,
    klaviyoSubscribeProfile,
    klaviyoUnsubscribeProfile,
    klaviyoAddProfileToList,
    klaviyoRemoveProfileFromList,
    klaviyoCreateList,
    klaviyoFindProfileByEmailOrPhone,
    klaviyoFindListByName,
    klaviyoFindTagByName,
    createCustomApiCallAction({
      baseUrl: () => 'https://a.klaviyo.com/api',
      auth: klaviyoAuth,
      authMapping: async (auth) => ({
        Authorization: `Klaviyo-API-Key ${auth}`,
        revision: '2024-10-15',
      }),
    }),
  ],
  triggers: [
    klaviyoNewProfileTrigger,
    klaviyoProfileAddedToListTrigger,
  ],
});
