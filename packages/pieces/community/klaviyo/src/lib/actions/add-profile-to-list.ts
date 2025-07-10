import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';
import { listId } from '../common/props';

export const addProfileToListAction = createAction({
	auth: klaviyoAuth,
	name: 'add-profile-to-list',
	displayName: 'Add Profile to List',
	description: 'Adds one or more Klaviyo profiles to a specified list by profile ID.',
	props: {
		listId: listId,
		profileIds: Property.Json({
			displayName: 'Profile IDs',
			required: true,
			description:
				'An array of Klaviyo profile IDs to add to the list. Max 1000 items. Example: [ "abc123", "def456" ]',
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
			throw new Error('Maximum of 1000 profile IDs can be added in one request.');
		}

		const data = profileIds.map((id) => ({
			type: 'profile',
			id,
		}));

		const response = await klaviyoApiCall({
			apiKey: auth,
			method: HttpMethod.POST,
			resourceUri: `/lists/${listId}/relationships/profiles`,
			body: { data },
		});

		return response;
	},
});
