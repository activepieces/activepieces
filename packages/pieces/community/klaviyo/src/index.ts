import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { klaviyoAuth } from './lib/common/auth';
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
import { newProfileTrigger } from './lib/triggers/new-profile';
import { profileAddedToListTrigger } from './lib/triggers/profile-added-to-list';

export const klaviyo = createPiece({
  displayName: 'Klaviyo',
  auth: klaviyoAuth,
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.MARKETING],
  logoUrl: 'https://cdn.activepieces.com/pieces/klaviyo.png',
  authors: ['St34lthcole'],
  actions: [
    createProfileAction,
    updateProfileAction,
    subscribeProfileAction,
    unsubscribeProfileAction,
    addProfileToListAction,
    removeProfileFromListAction,
    createListAction,
    findProfileAction,
    findListAction,
    findTagAction,
  ],
  triggers: [
    newProfileTrigger,
    profileAddedToListTrigger,
  ],
});
