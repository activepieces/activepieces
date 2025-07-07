import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

export const findProfileAction = createAction({
	auth: klaviyoAuth,
	name: 'find-profile',
	displayName: 'Find Profile by Email or Phone',
	description: 'Find a Klaviyo profile by email or phone number.',
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			required: false,
		}),
		phoneNumber: Property.ShortText({
			displayName: 'Phone Number',
			required: false,
			description: 'Phone number in E.164 format (e.g., +1234567890)',
		}),
		additionalFields: Property.StaticMultiSelectDropdown({
			displayName: 'Additional Fields',
			required: false,
			description: 'Request additional fields like subscriptions or predictive_analytics in the response.',
			options: {
				options: [
					{ label: 'Subscriptions', value: 'subscriptions' },
					{ label: 'Predictive Analytics', value: 'predictive_analytics' },
				],
			},
		}),
		pageSize: Property.Number({
			displayName: 'Results Limit',
			required: false,
			defaultValue: 1,
			description: 'Max number of profiles to return. Default is 1.',
		}),
	},
	async run({ auth, propsValue }) {
		const { email, phoneNumber, additionalFields, pageSize } = propsValue;

		if (!email && !phoneNumber) {
			throw new Error('You must provide either an email or phone number.');
		}

		const filterParts: string[] = [];
		if (email) filterParts.push(`email:${email}`);
		if (phoneNumber) filterParts.push(`phone_number:${phoneNumber}`);
		const filter = filterParts.join(',');

		const query: Record<string, string> = {
			'page[size]': (pageSize ?? 1).toString(),
			filter,
		};

		if (additionalFields?.length) {
			query['additional-fields[profile]'] = additionalFields.join(',');
		}

		const response = await klaviyoApiCall({
			apiKey: auth,
			method: HttpMethod.GET,
			resourceUri: '/profiles',
			query,
		});

		return response;
	},
});
