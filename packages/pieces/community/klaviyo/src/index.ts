import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { klaviyoAuth } from './lib/common/auth';

// Actions
import { createProfileAction } from './lib/actions/create-profile';
import { updateProfileAction } from './lib/actions/update-profile';
import { getProfileAction } from './lib/actions/get-profile';
import { findProfileByEmailAction } from './lib/actions/find-profile-by-email';
import { subscribeProfileAction } from './lib/actions/subscribe-profile';
import { unsubscribeProfileAction } from './lib/actions/unsubscribe-profile';
import { createListAction } from './lib/actions/create-list';
import { getListAction } from './lib/actions/get-list';
import { findListByNameAction } from './lib/actions/find-list-by-name';
import { addProfileToListAction } from './lib/actions/add-profile-to-list';
import { removeProfileFromListAction } from './lib/actions/remove-profile-from-list';
import { trackEventAction } from './lib/actions/track-event';
import { findTagByNameAction } from './lib/actions/find-tag-by-name';

// Triggers
import { newProfileTrigger } from './lib/triggers/new-profile';
import { profileAddedToListSegmentTrigger } from './lib/triggers/profile-added-to-list-segment';

export { klaviyoAuth };

export const klaviyo = createPiece({
  displayName: 'Klaviyo',
  description:
    'Marketing automation platform for email, SMS, and customer data — create profiles, manage lists, track events, and automate customer engagement.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/klaviyo.png',
  authors: ['CharlesWong'],
  categories: [PieceCategory.MARKETING],
  auth: klaviyoAuth,
  actions: [
    createProfileAction,
    updateProfileAction,
    getProfileAction,
    findProfileByEmailAction,
    subscribeProfileAction,
    unsubscribeProfileAction,
    createListAction,
    getListAction,
    findListByNameAction,
    addProfileToListAction,
    removeProfileFromListAction,
    trackEventAction,
    findTagByNameAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://a.klaviyo.com/api',
      auth: klaviyoAuth,
      authMapping: async (auth) => ({
        Authorization: `Klaviyo-API-Key ${auth}`,
        revision: '2024-10-15',
      }),
    }),
  ],
  triggers: [newProfileTrigger, profileAddedToListSegmentTrigger],
});
