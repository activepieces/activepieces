import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

export const unsubscribeProfileAction = createAction({
	auth: klaviyoAuth,
	name: 'unsubscribe-profile',
	displayName: 'Unsubscribe Profile',
	description: 'Unsubscribes one or more profiles from email/SMS marketing. A new profile will be created if it doesn’t exist.',
	props: {
		listId: Property.ShortText({
			displayName: 'List ID',
			required: false,
			description: 'Optional: List ID to unsubscribe profiles from. If omitted, global unsubscription will apply.',
		}),
		profiles: Property.Json({
			displayName: 'Profiles',
			description:
				'An array of profiles to unsubscribe. Each must include at least `email` or `phone_number`.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const { listId, profiles } = propsValue;

		if (!Array.isArray(profiles)) {
			throw new Error('Profiles must be an array of objects.');
		}

		if (profiles.length === 0) {
			throw new Error('At least one profile must be provided.');
		}

		if (profiles.length > 100) {
			throw new Error('Maximum of 100 profiles can be unsubscribed at once.');
		}

		const body: any = {
			data: {
				type: 'profile-subscription-bulk-delete-job',
				attributes: {
					profiles: {
						data: profiles,
					},
				},
			},
		};

		if (listId) {
			body.data.relationships = {
				list: {
					data: {
						type: 'list',
						id: listId,
					},
				},
			};
		}

		const response = await klaviyoApiCall({
			apiKey: auth,
			method: HttpMethod.POST,
			resourceUri: '/profile-subscription-bulk-delete-jobs',
			body,
		});

		return response;
	},
});
