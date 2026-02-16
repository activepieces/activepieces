import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Actions
import { createProfileAction } from './lib/actions/create-profile';
import { updateProfileAction } from './lib/actions/update-profile';
import { subscribeProfileAction } from './lib/actions/subscribe-profile';
import { unsubscribeProfileAction } from './lib/actions/unsubscribe-profile';
import { addProfileToListAction } from './lib/actions/add-profile-to-list';
import { removeProfileFromListAction } from './lib/actions/remove-profile-from-list';
import { createListAction } from './lib/actions/create-list';
import { findProfileAction } from './lib/actions/find-profile';
import { findListAction } from './lib/actions/find-list';
import { findTagAction } from './lib/actions/find-tag';

// Triggers
import { newProfileTrigger } from './lib/triggers/new-profile';
import { profileAddedToListTrigger } from './lib/triggers/profile-added-to-list';

// Constants
const KLAVIYO_API_BASE_URL = 'https://a.klaviyo.com/api';
const KLAVIYO_API_REVISION = '2024-10-15';

export const klaviyoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your Klaviyo private API key',
  required: true,
  validate: async ({ auth }) => {
    if (!auth || auth.length < 10) {
      return {
        valid: false,
        error: 'Invalid API key format',
      };
    }
    return {
      valid: true,
    };
  },
});

export const klaviyo = createPiece({
  displayName: 'Klaviyo',
  description: 'Email and SMS marketing automation platform',
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/klaviyo.png',
  authors: ['activepieces'],
  categories: [PieceCategory.MARKETING],
  auth: klaviyoAuth,
  actions: [
    // Write Actions
    createProfileAction,
    updateProfileAction,
    subscribeProfileAction,
    unsubscribeProfileAction,
    addProfileToListAction,
    removeProfileFromListAction,
    createListAction,
    // Search Actions
    findProfileAction,
    findListAction,
    findTagAction,
    // Custom API Call
    createCustomApiCallAction({
      baseUrl: () => KLAVIYO_API_BASE_URL,
      auth: klaviyoAuth,
      authMapping: async (auth) => ({
        'Authorization': `Klaviyo-API-Key ${auth}`,
        'revision': KLAVIYO_API_REVISION,
      }),
    }),
  ],
  triggers: [
    newProfileTrigger,
    profileAddedToListTrigger,
  ],
});
