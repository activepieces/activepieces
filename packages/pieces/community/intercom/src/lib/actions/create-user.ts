import { intercomAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomClient } from '../common';
import dayjs from 'dayjs';

export const createUserAction = createAction({
	auth: intercomAuth,
	name: 'create-user',
	displayName: 'Create User',
	description: 'Creates a new user.',
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
