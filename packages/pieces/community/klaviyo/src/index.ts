import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createProfile } from './lib/actions/create-profile';
import { updateProfile } from './lib/actions/update-profile';
import { subscribeProfile } from './lib/actions/subscribe-profile';
import { unsubscribeProfile } from './lib/actions/unsubscribe-profile';
import { addProfileToList } from './lib/actions/add-profile-to-list';
import { removeProfileFromList } from './lib/actions/remove-profile-from-list';
import { createList } from './lib/actions/create-list';
import { findProfileByEmailOrPhone } from './lib/actions/find-profile';
import { findListByName } from './lib/actions/find-list-by-name';
import { findTagByName } from './lib/actions/find-tag-by-name';
import { newProfileTrigger } from './lib/triggers/new-profile';
import { profileAddedToListTrigger } from './lib/triggers/profile-added-to-list';
import { KLAVIYO_API_REVISION } from './lib/common';

export const klaviyoAuth = PieceAuth.SecretText({
  displayName: 'Private API Key',
  description:
    'Your Klaviyo private API key. Generate one from Account > Settings > API Keys.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await fetch('https://a.klaviyo.com/api/lists', {
        headers: {
          Authorization: `Klaviyo-API-Key ${auth}`,
          revision: KLAVIYO_API_REVISION,
          Accept: 'application/vnd.api+json',
        },
      });
      if (!response.ok) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your Klaviyo private API key.',
        };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: 'Could not connect to Klaviyo.' };
    }
  },
});

export const klaviyo = createPiece({
  displayName: 'Klaviyo',
  description:
    'Marketing automation for email, SMS, and customer data management.',
  auth: klaviyoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/klaviyo.png',
  categories: [PieceCategory.MARKETING],
  authors: ['SolariSystems'],
  actions: [
    createProfile,
    updateProfile,
    subscribeProfile,
    unsubscribeProfile,
    addProfileToList,
    removeProfileFromList,
    createList,
    findProfileByEmailOrPhone,
    findListByName,
    findTagByName,
    createCustomApiCallAction({
      baseUrl: () => 'https://a.klaviyo.com/api',
      auth: klaviyoAuth,
      authMapping: async (auth) => ({
        Authorization: `Klaviyo-API-Key ${auth as string}`,
        revision: KLAVIYO_API_REVISION,
      }),
    }),
  ],
  triggers: [newProfileTrigger, profileAddedToListTrigger],
});
