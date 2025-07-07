import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

export const createProfileAction = createAction({
	auth: klaviyoAuth,
	name: 'create-profile',
	displayName: 'Create Profile',
	description: 'Creates a new Klaviyo profile and optionally includes subscription and predictive analytics fields.',
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			required: false,
		}),
		phoneNumber: Property.ShortText({
			displayName: 'Phone Number',
			required: false,
			description: 'Phone number in E.164 format',
		}),
		externalId: Property.ShortText({
			displayName: 'External ID',
			required: false,
			description: 'Your internal ID or another unique identifier for the profile',
		}),
		firstName: Property.ShortText({
			displayName: 'First Name',
			required: false,
		}),
		lastName: Property.ShortText({
			displayName: 'Last Name',
			required: false,
		}),
		organization: Property.ShortText({
			displayName: 'Organization',
			required: false,
		}),
		locale: Property.ShortText({
			displayName: 'Locale',
			required: false,
			description: 'In IETF BCP 47 format like en-US or fr-FR',
		}),
		title: Property.ShortText({
			displayName: 'Title',
			required: false,
			description: 'Job title',
		}),
		image: Property.ShortText({
			displayName: 'Image URL',
			required: false,
			description: 'URL pointing to the profile image',
		}),
		location: Property.Json({
			displayName: 'Location',
			required: false,
			description: 'Location object, e.g. { "city": "London", "country": "GB" }',
		}),
		properties: Property.Json({
			displayName: 'Custom Properties',
			required: false,
			description: 'Key-value pairs of custom profile properties',
		}),
		additionalFields: Property.Object({
			displayName: 'Additional Fields in Response',
			description: 'Use keys like `subscriptions: true` or `predictive_analytics: true` to include fields in the response.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const {
			email,
			phoneNumber,
			externalId,
			firstName,
			lastName,
			organization,
			locale,
			title,
			image,
			location,
			properties,
			additionalFields,
		} = propsValue;

		const attributes: Record<string, any> = {
			email,
			phone_number: phoneNumber,
			external_id: externalId,
			first_name: firstName,
			last_name: lastName,
			organization,
			locale,
			title,
			image,
			location,
			properties,
		};

		Object.entries(attributes).forEach(([key, value]) => {
			if (value === undefined || value === null) {
				delete attributes[key];
			}
		});

		const query: Record<string, string> = {};

		if (additionalFields && typeof additionalFields === 'object') {
			const selectedFields = Object.entries(additionalFields)
				.filter(([, value]) => Boolean(value))
				.map(([key]) => key);

			if (selectedFields.length > 0) {
				query['additional-fields[profile]'] = selectedFields.join(',');
			}
		}

		const response = await klaviyoApiCall({
			apiKey: auth,
			method: HttpMethod.POST,
			resourceUri: '/profiles',
			query,
			body: {
				data: {
					type: 'profile',
					attributes,
				},
			},
		});

		return response;
	},
});
