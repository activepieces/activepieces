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
			required: true,
		}),
		phoneNumber: Property.ShortText({
			displayName: 'Phone Number',
			required: true,
			description: 'Phone number in E.164 format',
		}),
		externalId: Property.ShortText({
			displayName: 'External ID',
			required: false,
			description: 'Your internal ID or another unique identifier for the profile',
		}),
		firstName: Property.ShortText({
			displayName: 'First Name',
			required: true,
		}),
		lastName: Property.ShortText({
			displayName: 'Last Name',
			required: true,
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
		address1: Property.ShortText({
			displayName: 'Address Line 1',
			required: true,
		}),
		address2: Property.ShortText({
			displayName: 'Address Line 2',
			required: false,
		}),
		city: Property.ShortText({
			displayName: 'City',
			required: true,
		}),
		country: Property.ShortText({
			displayName: 'Country',
			required: true,
		}),
		region: Property.ShortText({
			displayName: 'Region/State',
			required: true,
		}),
		zip: Property.ShortText({
			displayName: 'Zip Code',
			required: true,
		}),
		timezone: Property.ShortText({
			displayName: 'Timezone',
			required: false,
			description: 'IANA time zone name, e.g. America/New_York',
		}),
		ip: Property.ShortText({
			displayName: 'IP Address',
			required: false,
		}),
		latitude: Property.ShortText({
			displayName: 'Latitude',
			required: false,
		}),
		longitude: Property.ShortText({
			displayName: 'Longitude',
			required: false,
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
			address1,
			address2,
			city,
			country,
			region,
			zip,
			timezone,
			ip,
			latitude,
			longitude,
			properties,
			additionalFields,
		} = propsValue;

		const location: Record<string, string | undefined> = {
			address1,
			address2,
			city,
			country,
			region,
			zip,
			timezone,
			ip,
			latitude,
			longitude,
		};

		Object.keys(location).forEach((key) => {
			if (location[key] === undefined || location[key] === '') {
				delete location[key];
			}
		});

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
			location: Object.keys(location).length > 0 ? location : undefined,
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
			headers: {
				revision: '2025-04-15',
				'content-type': 'application/vnd.api+json',
				accept: 'application/vnd.api+json',
			},
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
