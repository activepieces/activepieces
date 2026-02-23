import {
  HttpMethod,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { newProfile } from './lib/trigger/new-profile';
import { newEvent } from './lib/trigger/new-event';
import { profileAddedToList } from './lib/trigger/profile-added-to-list';
import { createOrUpdateProfile } from './lib/actions/create-or-update-profile';
import { trackEvent } from './lib/actions/track-event';
import { subscribeProfile } from './lib/actions/subscribe-profile';
import { unsubscribeProfile } from './lib/actions/unsubscribe-profile';
import { addProfileToList } from './lib/actions/add-profile-to-list';
import { removeProfileFromList } from './lib/actions/remove-profile-from-list';
import { createList } from './lib/actions/create-list';
import { findListByName } from './lib/actions/find-list-by-name';
import { findProfile } from './lib/actions/find-profile';
import { findTagByName } from './lib/actions/find-tag-by-name';

export const klaviyoAuth = PieceAuth.SecretText({
  displayName: 'Private API Key',
  required: true,
  description: 'Your Klaviyo private API key',
  validate: async (auth) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://a.klaviyo.com/api/accounts',
        headers: {
          'Authorization': `Klaviyo-API-Key ${auth.auth}`,
          'Revision': '2024-10-15',
          'Accept': 'application/json',
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key. Please check the key and try again.',
      };
    }
  },
});

export const klaviyo = createPiece({
  displayName: 'Klaviyo',
  description: 'Marketing automation platform for email, SMS, and customer data management',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/klaviyo.png',
  authors: ['activepieces'],
  categories: [PieceCategory.MARKETING],
  auth: klaviyoAuth,
  actions: [
    createOrUpdateProfile,
    trackEvent,
    subscribeProfile,
    unsubscribeProfile,
    addProfileToList,
    removeProfileFromList,
    createList,
    findListByName,
    findProfile,
    findTagByName,
    createCustomApiCallAction({
      baseUrl: () => 'https://a.klaviyo.com/api',
      auth: klaviyoAuth,
      authMapping: async (auth) => ({
        'Authorization': `Klaviyo-API-Key ${auth.secret_text}`,
        'Revision': '2024-10-15',
      }),
      name: 'custom_api_call',
      displayName: 'Custom API Call',
      description: 'Make a custom API call to Klaviyo API',
    }),
  ],
  triggers: [
    newProfile,
    newEvent,
    profileAddedToList,
  ],
});