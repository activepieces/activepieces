import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { klaviyoAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/client';
import { addProfileToListAction } from './lib/actions/add-profile-to-list';
import { createListAction } from './lib/actions/create-list';
import { createProfileAction } from './lib/actions/create-profile';
import { findListByNameAction } from './lib/actions/find-list-by-name';
import { findProfileAction } from './lib/actions/find-profile';
import { findTagsAction } from './lib/actions/find-tag-by-name';
import { removeProfileFromListAction } from './lib/actions/remove-profile-from-list';
import { subscribeProfileAction } from './lib/actions/subscribe-profile';
import { unsubscribeProfileAction } from './lib/actions/unsubscribe-profile';
import { updateProfileAction } from './lib/actions/update-profile';
import { newProfileTrigger } from './lib/triggers/new-profile';
import { profileAddedTrigger } from './lib/triggers/profile-added';


export const klaviyo = createPiece({
	displayName: 'Klaviyo',
	auth: klaviyoAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://www.klaviyo.com/favicon.ico',
	authors: ['aryel780'],
	actions: [
		addProfileToListAction,
		createListAction,
		createProfileAction,
		findListByNameAction,
		findProfileAction,
		findTagsAction,
		removeProfileFromListAction,
		subscribeProfileAction,
		unsubscribeProfileAction,
		updateProfileAction,
		createCustomApiCallAction({
			auth: klaviyoAuth,
			baseUrl: () => BASE_URL,
			authMapping: async (auth) => ({
				Authorization: `Klaviyo-API-Key ${auth as string}`,
			}),
		}),
	],
	triggers: [newProfileTrigger, profileAddedTrigger],
});

export { klaviyoAuth };
