import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';
import { profileId } from '../common/props';

export const updateProfileAction = createAction({
	auth: klaviyoAuth,
	name: 'update-profile',
	displayName: 'Update Profile',
	description:
		'Updates a Klaviyo profile by ID. Setting a field to null will clear it. Omitting it will leave it unchanged.',
	props: {
		profileId: profileId,
		email: Property.ShortText({
			displayName: 'Email',
			required: false
		}),
		phoneNumber: Property.ShortText({
			displayName: 'Phone Number',
			required: false,
			description: 'Phone number in E.164 format',
		}),
		externalId: Property.ShortText({
			displayName: 'External ID',
			required: false
		}),
		anonymousId: Property.ShortText({
			displayName: 'Anonymous ID',
			required: false
		}),
		firstName: Property.ShortText({
			displayName: 'First Name',
			required: false
		}),
		lastName: Property.ShortText({
			displayName: 'Last Name',
			required: false
		}),
		organization: Property.ShortText({
			displayName: 'Organization',
			required: false
		}),
		locale: Property.ShortText({
			displayName: 'Locale',
			required: false
		}),
		title: Property.ShortText({
			displayName: 'Title',
			required: false
		}),
		image: Property.ShortText({
			displayName: 'Image URL',
			required: false,
			description: 'URL pointing to the profile image',
		}),
		address1: Property.ShortText({
			displayName: 'Address Line 1',
			required: false
		}),
		address2: Property.ShortText({
			displayName: 'Address Line 2',
			required: false
		}),
		city: Property.ShortText({
			displayName: 'City',
			required: false
		}),
		country: Property.ShortText({
			displayName: 'Country',
			required: false
		}),
		region: Property.ShortText({
			displayName: 'Region/State',
			required: false
		}),
		zip: Property.ShortText({
			displayName: 'Zip Code',
			required: false
		}),
		timezone: Property.ShortText({
			displayName: 'Timezone',
			required: false,
			description: 'IANA time zone name, e.g. America/New_York',
		}),
		ip: Property.ShortText({
			displayName: 'IP Address',
			required: false
		}),
		latitude: Property.ShortText({
			displayName: 'Latitude',
			required: false
		}),
		longitude: Property.ShortText({
			displayName: 'Longitude',
			required: false
		}),
		properties: Property.Json({
			displayName: 'Custom Properties',
			required: false,
			description: 'Key-value pairs of custom profile properties',
		}),
		patchProperties: Property.Json({
			displayName: 'Patch Properties',
			required: false,
			description: 'Partial updates to nested properties, e.g. { "custom_property": null } to remove a field',
		}),
		additionalFields: Property.Object({
			displayName: 'Additional Fields in Response',
			required: false,
			description: 'e.g. { "subscriptions": true, "predictive_analytics": true }',
		}),
	},
	async run({ auth, propsValue }) {
		const {
			profileId,
			email,
			phoneNumber,
			externalId,
			anonymousId,
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
			patchProperties,
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
			anonymous_id: anonymousId,
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
			if (value === undefined) {
				delete attributes[key];
			}
		});

		const query: Record<string, string> = {};
		if (additionalFields && typeof additionalFields === 'object') {
			const selected = Object.entries(additionalFields)
				.filter(([, val]) => Boolean(val))
				.map(([key]) => key);
			if (selected.length > 0) {
				query['additional-fields[profile]'] = selected.join(',');
			}
		}

		const body: any = {
			data: {
				type: 'profile',
				id: profileId,
				attributes,
			},
		};

		if (patchProperties) {
			body.data.meta = {
				patch_properties: patchProperties,
			};
		}

		const response = await klaviyoApiCall({
			apiKey: auth,
			method: HttpMethod.PATCH,
			resourceUri: `/profiles/${profileId}`,
			query,
			headers: {
				revision: '2025-04-15',
				'content-type': 'application/vnd.api+json',
				accept: 'application/vnd.api+json',
			},
			body,
		});

		return response;
	},
});
