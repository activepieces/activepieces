import { createPiece } from '@activepieces/pieces-framework';
import { newPostCreated } from './lib/triggers/new-post';
import { newMemberAdded } from './lib/triggers/new-member-added';
import { createPost } from './lib/actions/create-post';
import { createComment } from './lib/actions/create-comment';
import { addMemberToSpace } from './lib/actions/add-member-to-space';
import { findMemberByEmail } from './lib/actions/find-member-by-email';
import { getPostDetailsAction } from './lib/actions/get-post-details';
import { getMemberDetails } from './lib/actions/get-member-details';
import { circleAuth } from './lib/common/auth';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common';

export const circle = createPiece({
	displayName: 'Circle',
	logoUrl: 'https://cdn.activepieces.com/pieces/circle.png',
	description: 'Circle.so is a platform for creating and managing communities.',
	auth: circleAuth,
	minimumSupportedRelease: '0.36.1',
	authors: ['onyedikachi-david', 'kishanprmr'],
	actions: [
		createPost,
		createComment,
		addMemberToSpace,
		findMemberByEmail,
		getPostDetailsAction,
		getMemberDetails,
		createCustomApiCallAction({
			auth: circleAuth,
			baseUrl: () => BASE_URL,
			authMapping: async (auth) => {
				return {
					Authorization: `Bearer ${auth}`,
				};
			},
		}),
	],
	triggers: [newPostCreated, newMemberAdded],
});
