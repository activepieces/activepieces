import { createAction, Property } from '@activepieces/pieces-framework';

import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { crispAuth } from '../common/auth';
import { websiteIdProp } from '../common/props';
import { crispApiCall } from '../common/client';
import { HttpStatusCode } from 'axios';

export const findUserProfileAction = createAction({
	auth: crispAuth,
	name: 'find_user_profile',
	displayName: 'Find User Profile',
	description: 'Finds a user profile by email address.',
	props: {
		websiteId: websiteIdProp,
		email: Property.ShortText({
			displayName: 'Email Address',
			description: 'The email address of the user to find.',
			required: true,
		}),
	},
	async run(context) {
		const { websiteId, email } = context.propsValue;

		try {
			const response = await crispApiCall<{ data: Record<string, any> }>({
				auth: context.auth,
				method: HttpMethod.GET,
				resourceUri: `/website/${websiteId}/people/profile/${email}`,
			});

			return {
				found: true,
				data: response.data,
			};
		} catch (e) {
			const err = e as HttpError;
			if (err.response.status === HttpStatusCode.NotFound) {
				return {
					found: false,
					data: {},
				};
			}

			throw err;
		}
	},
});
