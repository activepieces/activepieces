import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';
import { listId } from '../common/props';

export const removeProfileFromListAction = createAction({
	auth: klaviyoAuth,
	name: 'remove-profile-from-list',
	displayName: 'Remove Profile from List',
	description: 'Removes one or more Klaviyo profiles from a specific list by profile ID.',
	props: {
		listId: listId,
		profileIds: Property.Json({
			displayName: 'Profile IDs',
			required: true,
			description:
				'An array of Klaviyo profile IDs to remove from the list. Max 1000. Example: ["abc123", "def456"]',
		}),
	},
	async run({ auth, propsValue }) {
		const { listId, profileIds } = propsValue;

		if (!Array.isArray(profileIds)) {
			throw new Error('`profileIds` must be an array of strings.');
		}

		if (profileIds.length === 0) {
			throw new Error('At least one profile ID is required.');
		}

		if (profileIds.length > 1000) {
			throw new Error('You can only remove up to 1000 profiles at a time.');
		}

		const data = profileIds.map((id) => ({
			type: 'profile',
			id,
		}));

		const response = await klaviyoApiCall({
			apiKey: auth,
			method: HttpMethod.DELETE,
			resourceUri: `/lists/${listId}/relationships/profiles`,
			body: { data },
		});

		return response;
	},
});
