import { klaviyoAuth } from '../../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';

export const findProfileByEmailAction = createAction({
	auth: klaviyoAuth,
	name: 'klaviyo_find_profile_by_email',
	displayName: 'Find Profile by Email',
	description: 'Search for a Klaviyo profile by email address.',
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			required: true,
		}),
	},
	async run(context) {
		const { email } = context.propsValue;
		const client = makeClient(context.auth);
		const res = await client.getProfileByEmail(email);
		return res.data && res.data.length > 0 ? res.data[0] : null;
	},
});
