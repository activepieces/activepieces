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
import { findProfile } from './lib/actions/find-profile';
import { findList } from './lib/actions/find-list';
import { findTag } from './lib/actions/find-tag';
import { newProfile } from './lib/triggers/new-profile';
import { profileAddedToList } from './lib/triggers/profile-added-to-list';

export const klaviyoAuth = PieceAuth.SecretText({
  displayName: 'Private API Key',
  description:
    'Your Klaviyo private API key. You can find it in Klaviyo under Settings > API Keys.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await fetch('https://a.klaviyo.com/api/lists?page[size]=1', {
        headers: {
          Authorization: `Klaviyo-API-Key ${auth}`,
          accept: 'application/json',
          revision: '2024-10-15',
        },
      });
      if (response.ok) {
        return { valid: true };
      }
      return { valid: false, error: 'Invalid API Key' };
    } catch {
      return { valid: false, error: 'Connection failed' };
    }
  },
});

export const klaviyo = createPiece({
  displayName: 'Klaviyo',
  description: 'Marketing automation platform for email, SMS, and customer data',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/klaviyo.png',
  authors: ['duomi2017'],
  categories: [PieceCategory.MARKETING],
  auth: klaviyoAuth,
  actions: [
    createProfile,
    updateProfile,
    subscribeProfile,
    unsubscribeProfile,
    addProfileToList,
    removeProfileFromList,
    createList,
    findProfile,
    findList,
    findTag,
    createCustomApiCallAction({
      baseUrl: () => 'https://a.klaviyo.com/api',
      auth: klaviyoAuth,
      authMapping: async (auth) => ({
        Authorization: `Klaviyo-API-Key ${auth as string}`,
        revision: '2024-10-15',
      }),
    }),
  ],
  triggers: [newProfile, profileAddedToList],
});
