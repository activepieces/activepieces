import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

export const findProfileAction = createAction({
	auth: klaviyoAuth,
	name: 'find-profile',
	displayName: 'Find Profile by Email or Phone',
	description: 'Find a Klaviyo profile using an email address or phone number.',
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
			description: 'Include additional fields like subscriptions or predictive analytics in the response.',
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
			description: 'Maximum number of profiles to return. Default is 1.',
		}),
		pageCursor: Property.ShortText({
			displayName: 'Page Cursor',
			required: false,
			description: 'Cursor for pagination.',
		}),
	},

	async run({ auth, propsValue }) {
		const { email, phoneNumber, additionalFields, pageSize, pageCursor } = propsValue;

		if (!email && !phoneNumber) {
			throw new Error('You must provide either an email or a phone number.');
		}

		const query: Record<string, string> = {
			'page[size]': (pageSize ?? 1).toString(),
		};

		const filterParts: string[] = [];
		if (email) filterParts.push(`equals(email,"${email}")`);
		if (phoneNumber) filterParts.push(`equals(phone_number,"${phoneNumber}")`);

		query['filter'] = filterParts.join(',');

		if (additionalFields?.length) {
			query['additional-fields[profile]'] = additionalFields.join(',');
		}

		if (pageCursor) {
			query['page[cursor]'] = pageCursor;
		}

		const response = await klaviyoApiCall({
			apiKey: auth,
			method: HttpMethod.GET,
			resourceUri: '/profiles',
			query,
			headers: {
				accept: 'application/vnd.api+json',
				revision: '2025-04-15',
			},
		});

		return response;
	},
});
