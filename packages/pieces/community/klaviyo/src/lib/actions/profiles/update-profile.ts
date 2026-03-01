import { klaviyoAuth } from '../../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';

export const updateProfileAction = createAction({
	auth: klaviyoAuth,
	name: 'klaviyo_update_profile',
	displayName: 'Update Profile',
	description: 'Updates an existing profile in Klaviyo.',
	props: {
		profileId: Property.ShortText({
			displayName: 'Profile ID',
			required: true,
			description: 'The unique ID of the profile to update.',
		}),
		email: Property.ShortText({
			displayName: 'Email',
			required: false,
		}),
		phoneNumber: Property.ShortText({
			displayName: 'Phone Number',
			required: false,
		}),
		externalId: Property.ShortText({
			displayName: 'External ID',
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
		title: Property.ShortText({
			displayName: 'Title',
			required: false,
		}),
		properties: Property.Object({
			displayName: 'Properties',
			required: false,
			description: 'Custom properties for the profile.',
		}),
	},
	async run(context) {
		const { profileId, email, phoneNumber, externalId, firstName, lastName, organization, title, properties } = context.propsValue;

		const profileAttributes: any = {
			email,
			phone_number: phoneNumber,
			external_id: externalId,
			first_name: firstName,
			last_name: lastName,
			organization,
			title,
			properties,
		};

		// Remove undefined/null values
		Object.keys(profileAttributes).forEach(key => profileAttributes[key] === undefined && delete profileAttributes[key]);

		const client = makeClient(context.auth);
		return await client.updateProfile(profileId, profileAttributes);
	},
});
