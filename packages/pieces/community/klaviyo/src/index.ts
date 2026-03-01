import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { klaviyoAuth } from './lib/auth';
import { createProfileAction } from './lib/actions/profiles/create-profile';
import { updateProfileAction } from './lib/actions/profiles/update-profile';
import { addProfileToListAction } from './lib/actions/lists/add-profile-to-list';
import { removeProfileFromListAction } from './lib/actions/lists/remove-profile-from-list';
import { createListAction } from './lib/actions/lists/create-list';
import { findProfileByEmailAction } from './lib/actions/search/find-profile-by-email';
import { newProfileTrigger } from './lib/triggers/new-profile';
import { profileAddedToListTrigger } from './lib/triggers/profile-added-to-list';

export const klaviyo = createPiece({
	displayName: 'Klaviyo',
	description: 'Marketing automation platform for email, SMS, and customer data.',
	auth: klaviyoAuth,
	minimumSupportedRelease: '0.30.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/klaviyo.png',
	categories: [PieceCategory.MARKETING],
	authors: ["Yuki9814"],
	actions: [
		createProfileAction,
		updateProfileAction,
		addProfileToListAction,
		removeProfileFromListAction,
		createListAction,
		findProfileByEmailAction,
	],
	triggers: [
		newProfileTrigger,
		profileAddedToListTrigger,
	],
});
