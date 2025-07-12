import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';
import { listId } from '../common/props';

export const subscribeProfileAction = createAction({
	auth: klaviyoAuth,
	name: 'subscribe-profile',
	displayName: 'Subscribe Profile',
	description:
		'Subscribes one or more profiles to email/SMS marketing. Optionally adds to a list. If `historical_import` is true, `consented_at` must be provided for each profile.',
	props: {
		listId: listId,
		historicalImport: Property.Checkbox({
			displayName: 'Historical Import',
			required: false,
			defaultValue: false,
			description:
				'If true, skips double opt-in and requires consented_at timestamp in each profile.',
		}),
		customSource: Property.ShortText({
			displayName: 'Custom Source',
			required: false,
			description:
				'Optional source label, e.g. "Newsletter Signup" or "Landing Page".',
		}),
		profiles: Property.Json({
			displayName: 'Profiles',
			description:
				'An array of profiles to subscribe. Each must include at least `email` or `phone_number`. If `historical_import` is true, must include `consented_at`.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const { listId, historicalImport, customSource, profiles } = propsValue;

		if (!Array.isArray(profiles)) {
			throw new Error('Profiles must be an array of objects.');
		}

		if (profiles.length === 0) {
			throw new Error('At least one profile must be provided.');
		}

		if (profiles.length > 1000) {
			throw new Error('Maximum of 1000 profiles can be submitted at once.');
		}

		if (historicalImport) {
			for (const profile of profiles) {
				if (!profile.consented_at) {
					throw new Error(
						'Each profile must include `consented_at` when historical_import is true.'
					);
				}
			}
		}

		const body: any = {
			data: {
				type: 'profile-subscription-bulk-create-job',
				attributes: {
					historical_import: historicalImport ?? false,
					custom_source: customSource,
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
			resourceUri: '/profile-subscription-bulk-create-jobs',
			body,
		});

		return response;
	},
});
