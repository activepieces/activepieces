import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createProfile } from './lib/actions/create-profile';
import { updateProfile } from './lib/actions/update-profile';
import { subscribeProfile } from './lib/actions/subscribe-profile';
import { unsubscribeProfile } from './lib/actions/unsubscribe-profile';
import { addProfileToList } from './lib/actions/add-profile-to-list';
import { removeProfileFromList } from './lib/actions/remove-profile-from-list';
import { createList } from './lib/actions/create-list';
import { findProfileByEmailOrPhone } from './lib/actions/find-profile';
import { findListByName } from './lib/actions/find-list';
import { findTagByName } from './lib/actions/find-tag';
import { newProfileTrigger } from './lib/triggers/new-profile';
import { profileAddedToListTrigger } from './lib/triggers/profile-added-to-list';

export const klaviyoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To obtain your Klaviyo private API key:
1. Log in to your Klaviyo account.
2. Navigate to **Settings** > **Account** > **API Keys**.
3. Click **Create Private API Key**.
4. Select the required scopes (profiles, lists, subscriptions, tags).
5. Copy and paste the key here.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await fetch('https://a.klaviyo.com/api/lists?page[size]=1', {
        headers: {
          Authorization: `Klaviyo-API-Key ${auth}`,
          revision: '2024-10-15',
          Accept: 'application/vnd.api+json',
        },
      });
      if (response.ok) {
        return { valid: true };
      }
      return {
        valid: false,
        error: 'Invalid API key. Please check your Klaviyo private API key.',
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Could not connect to Klaviyo. Please check your API key.',
      };
    }
  },
});

export const klaviyo = createPiece({
  displayName: 'Klaviyo',
  description:
    'Marketing automation platform for email, SMS, and customer data. Create, manage, and interact with profiles, lists, and subscriptions.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/klaviyo.png',
  authors: ['fayanwubian-hue'],
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
    findProfileByEmailOrPhone,
    findListByName,
    findTagByName,
    createCustomApiCallAction({
      baseUrl: () => 'https://a.klaviyo.com/api',
      auth: klaviyoAuth,
      authMapping: async (auth) => ({
        Authorization: `Klaviyo-API-Key ${(auth as string)}`,
        revision: '2024-10-15',
      }),
    }),
  ],
  triggers: [newProfileTrigger, profileAddedToListTrigger],
});
