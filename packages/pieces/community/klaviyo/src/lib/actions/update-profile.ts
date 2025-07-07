import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

export const updateProfileAction = createAction({
	auth: klaviyoAuth,
	name: 'update-profile',
	displayName: 'Update Profile',
	description: 'Updates a Klaviyo profile by ID. Setting a field to null will clear it. Omitting it will leave it unchanged.',
	props: {
		profileId: Property.ShortText({
			displayName: 'Profile ID',
			required: true,
			description: 'The ID of the Klaviyo profile to update.',
		}),
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
		}),
		anonymousId: Property.ShortText({
			displayName: 'Anonymous ID',
			required: false,
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
		}),
		title: Property.ShortText({
			displayName: 'Title',
			required: false,
		}),
		image: Property.ShortText({
			displayName: 'Image URL',
			required: false,
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
			location,
			properties,
			patchProperties,
			additionalFields,
		} = propsValue;

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
			location,
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
			body,
		});

		return response;
	},
});
