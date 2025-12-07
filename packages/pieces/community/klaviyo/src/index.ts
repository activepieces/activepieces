import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { klaviyoAuth } from './lib/auth';

// Actions
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

// Triggers
import { newProfile } from './lib/triggers/new-profile';
import { profileAddedToList } from './lib/triggers/profile-added-to-list';

export const klaviyo = createPiece({
  displayName: 'Klaviyo',
  description: 'Marketing automation platform for email, SMS, and customer data management',
  auth: klaviyoAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/klaviyo.png',
  authors: [],
  categories: [PieceCategory.MARKETING],
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
  ],
  triggers: [
    newProfile,
    profileAddedToList,
  ],
});
