import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { klaviyoAuth, getAuthorizationHeader } from './lib/common/auth';
import { BASE_URL, CUSTOM_API_CALL_REVISION } from './lib/common/client';
import { createProfile } from './lib/actions/create-profile';
import { updateProfile } from './lib/actions/update-profile';
import { addProfileToList } from './lib/actions/add-profile-to-list';
import { createList } from './lib/actions/create-list';
import { findListByName } from './lib/actions/find-list-by-name';
import { findProfileByEmailPhone } from './lib/actions/find-profile-by-email-phone';
import { findTagByName } from './lib/actions/find-tag-by-name';
import { removeProfileFromList } from './lib/actions/remove-profile-from-list';
import { subscribeProfile } from './lib/actions/subscribe-profile';
import { unsubscribeProfile } from './lib/actions/unsubscribe-profile';
import { createOrUpdateProfile } from './lib/actions/create-or-update-profile';
import { trackEvent } from './lib/actions/track-event';
import { addTagToGroup } from './lib/actions/add-tag-to-group';
import { removeTagFromGroup } from './lib/actions/remove-tag-from-group';
import { deleteList } from './lib/actions/delete-list';
import { klaviyoAiActions } from './lib/actions/ai';
import { newProfileTrigger } from './lib/triggers/new-profile';
import { profileAddedToListOrSegmentTrigger } from './lib/triggers/profile-added-to-list-segment';
import { newEventTrigger } from './lib/triggers/new-event';

export const klaviyo = createPiece({
  displayName: 'Klaviyo',
  auth: klaviyoAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/klaviyo.png',
  categories: [PieceCategory.MARKETING],
  authors: ['Sanket6652'],
  actions: [
    createProfile,
    updateProfile,
    createOrUpdateProfile,
    addProfileToList,
    createList,
    findListByName,
    findProfileByEmailPhone,
    findTagByName,
    removeProfileFromList,
    subscribeProfile,
    unsubscribeProfile,
    trackEvent,
    addTagToGroup,
    removeTagFromGroup,
    deleteList,
    ...klaviyoAiActions,
    createCustomApiCallAction({
      baseUrl: () => BASE_URL,
      auth: klaviyoAuth,
      authMapping: async (auth) => ({
        Authorization: getAuthorizationHeader(auth),
        revision: CUSTOM_API_CALL_REVISION,
        accept: 'application/vnd.api+json',
      }),
    }),
  ],
  triggers: [newProfileTrigger, profileAddedToListOrSegmentTrigger, newEventTrigger],
});
