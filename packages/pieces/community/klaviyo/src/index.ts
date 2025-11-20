import {
  createPiece,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { makeClient } from './lib/common';

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

const authGuide = `
To obtain your Klaviyo API Key, follow these steps:

1. Log in to your Klaviyo account at https://www.klaviyo.com/login
2. Click on your account name in the bottom-left corner
3. Navigate to **Settings** > **API Keys**
4. Under **Private API Keys**, click **Create Private API Key**
5. Give your key a descriptive name (e.g., "Activepieces Integration")
6. Set the appropriate permissions (Full Access recommended for all features)
7. Click **Create** and copy the API key

**Important:** Store your API key securely - it won't be shown again after creation.

**Note:** You can create a free test account at https://www.klaviyo.com/signup to try this integration.
`;

export const klaviyoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: authGuide,
  validate: async ({ auth }) => {
    try {
      const client = makeClient(auth);
      await client.authenticate();
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API Key. Please check your credentials and try again.',
      };
    }
  },
});

export const klaviyo = createPiece({
  displayName: 'Klaviyo',
  description: 'Email marketing and automation platform for ecommerce',
  auth: klaviyoAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/klaviyo.png',
  categories: [PieceCategory.MARKETING],
  authors: ['activepieces'],
  actions: [
    // Search Actions
    findProfileAction,
    findListAction,
    findTagAction,
    // Write Actions
    createProfileAction,
    updateProfileAction,
    subscribeProfileAction,
    unsubscribeProfileAction,
    addProfileToListAction,
    removeProfileFromListAction,
    createListAction,
  ],
  triggers: [
    newProfileTrigger,
    profileAddedToListTrigger,
  ],
});

