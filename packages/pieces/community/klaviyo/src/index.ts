import { createPiece } from '@activepieces/pieces-framework';
import { klaviyoAuth } from './lib/auth';
import { createProfile } from './lib/actions/create-profile';
import { updateProfile } from './lib/actions/update-profile';
import { addProfileToList } from './lib/actions/add-profile-to-list';
import { findProfile } from './lib/actions/find-profile';
import { removeProfileFromList } from './lib/actions/remove-profile-from-list';
import { createList } from './lib/actions/create-list';
import { newProfile } from './lib/triggers/new-profile';
import { profileAddedToList } from './lib/triggers/profile-added-to-list';

export const klaviyo = createPiece({
    displayName: 'Klaviyo',
    description: 'Marketing automation for email, SMS, and customer data.',
    logoUrl: 'https://cdn.activepieces.com/pieces/klaviyo.png',
    auth: klaviyoAuth,
    authors: ['Vineeth8886'],
    actions: [createProfile, updateProfile, addProfileToList, findProfile, removeProfileFromList, createList],
    triggers: [newProfile, profileAddedToList],
});
