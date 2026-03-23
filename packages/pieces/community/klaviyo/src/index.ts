import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';

import {
  klaviyoAuth,
  KlaviyoAuthValue,
  getAuthorizationHeader,
} from './lib/common/auth';
import { createProfile } from './lib/actions/create-profile';
import { updateProfile } from './lib/actions/update-profile';

import { addProfileToList } from './lib/actions/add-profile-to-list';
import { newProfileTrigger } from './lib/triggers/new-profile';
import { createList } from './lib/actions/create-list';
import { findListByName } from './lib/actions/find-list-by-name';
import { findProfileByEmailPhone } from './lib/actions/find-profile-by-email-phone';
import { findTagByName } from './lib/actions/find-tag-by-name';
import { removeProfileFromList } from './lib/actions/remove-profile-from-list';
import { subscribeProfile } from './lib/actions/subscribe-profile';
import { unsubscribeProfile } from './lib/actions/unsubscribe-profile';
import { profileAddedToListOrSegmentTrigger } from './lib/triggers/profile-added-to-list-segment';

export const klaviyo = createPiece({
  displayName: 'Klaviyo',
  auth: klaviyoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/klaviyo.png',
  categories: [PieceCategory.MARKETING],
  authors: ['Sanket6652'],
  actions: [
    createProfile,
    updateProfile,
    addProfileToList,
    createList,
    findListByName,
    findProfileByEmailPhone,
    findTagByName,
    removeProfileFromList,
    subscribeProfile,
    unsubscribeProfile,
    createCustomApiCallAction({
      baseUrl: () => 'https://a.klaviyo.com/api',
      auth: klaviyoAuth,
      authMapping: async (auth) => ({
        Authorization: getAuthorizationHeader(auth as KlaviyoAuthValue),
        revision: '2025-04-15',
        accept: 'application/vnd.api+json',
      }),
    }),
  ],
  triggers: [newProfileTrigger, profileAddedToListOrSegmentTrigger],
});
