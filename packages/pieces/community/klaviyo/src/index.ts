import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { klaviyoAuth } from './lib/auth';

// Actions - Write
import { createProfile } from './lib/actions/create-profile';
import { updateProfile } from './lib/actions/update-profile';
import { subscribeProfile } from './lib/actions/subscribe-profile';
import { unsubscribeProfile } from './lib/actions/unsubscribe-profile';
import { addProfileToList } from './lib/actions/add-profile-to-list';
import { removeProfileFromList } from './lib/actions/remove-profile-from-list';
import { createList } from './lib/actions/create-list';

// Actions - Search
import { findProfile } from './lib/actions/find-profile';
import { findList } from './lib/actions/find-list';
import { findTag } from './lib/actions/find-tag';

// Triggers
import { newProfileTrigger } from './lib/triggers/new-profile';
import { profileAddedToListTrigger } from './lib/triggers/profile-added-to-list';

export const klaviyo = createPiece({
  displayName: 'Klaviyo',
  description: 'Email marketing and automation platform. Manage profiles, lists, and subscriptions.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/klaviyo.png',
  categories: [PieceCategory.MARKETING, PieceCategory.COMMUNICATION],
  auth: klaviyoAuth,
  actions: [
    // Write actions
    createProfile,
    updateProfile,
    subscribeProfile,
    unsubscribeProfile,
    addProfileToList,
    removeProfileFromList,
    createList,
    // Search actions
    findProfile,
    findList,
    findTag,
  ],
  triggers: [
    newProfileTrigger,
    profileAddedToListTrigger,
  ],
  authors: ['dyl4488'],
});
