import { intercomAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomClient } from '../common';
import dayjs from 'dayjs';

export const createUserAction = createAction({
	auth: intercomAuth,
	name: 'create-user',
	displayName: 'Create User',
	description: 'Creates a new user.',
	audience: 'both',
	aiMetadata: { description: 'Create a new user-role contact in Intercom from email and optional name, external user ID, signup time, and custom attributes. Always creates a record and does not check for an existing match, so it is not idempotent and repeated calls may produce duplicates. To update-if-exists instead, use Create/Update User.', idempotent: false },
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			required: true,
		}),
		createdAt: Property.DateTime({
			displayName: 'Created At',
			required: false,
		}),
		userId: Property.ShortText({
			displayName: 'User ID',
			required: false,
		}),
		name: Property.ShortText({
			displayName: 'Full Name',
			required: false,
		}),
		customAttributes: Property.Object({
			displayName: 'Custom Attributes',
			required: false,
		}),
	},
	async run(context) {
		const client = intercomClient(context.auth);

		const response = await client.contacts.create({
			role: 'user',
			email: context.propsValue.email,
			name: context.propsValue.name,
			custom_attributes: context.propsValue.customAttributes,
			signed_up_at: context.propsValue.createdAt
				? dayjs(context.propsValue.createdAt).unix()
				: undefined,
			external_id: context.propsValue.userId,
		});

		return response;
	},
});
