import { intercomAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomClient } from '../common';
import dayjs from 'dayjs';

export const createOrUpdateUserAction = createAction({
	auth: intercomAuth,
	name: 'create-or-update-user',
	displayName: 'Create/Update User',
	description: 'Update a user within intercom given an email address.',
	props: {
		email: Property.ShortText({
			displayName: 'Lookup Email',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Full Name',
			required: false,
		}),
		userId: Property.ShortText({
			displayName: 'User ID',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			required: false,
		}),
		createdAt: Property.DateTime({
			displayName: 'Created At',
			required: false,
		}),
		customAttributes: Property.Object({
			displayName: 'Custom Attributes',
			required: false,
		}),
	},
	async run(context) {
		const client = intercomClient(context.auth);

		const contact = await client.contacts.search({
			query: {
				operator: 'AND',
				value: [
					{
						field: 'email',
						operator: '=',
						value: context.propsValue.email,
					},
					{
						field: 'role',
						operator: '=',
						value: 'user',
					},
				],
			},
			pagination: { per_page: 1 },
		});

		if (contact.data.length === 0) {
			const response = await client.contacts.create({
				role: 'user',
				email: context.propsValue.email,
				name: context.propsValue.name,
				custom_attributes: context.propsValue.customAttributes,
				signed_up_at: context.propsValue.createdAt
					? dayjs(context.propsValue.createdAt).unix()
					: undefined,
				external_id: context.propsValue.userId,
				phone: context.propsValue.phone,
			});

			return response;
		}

		const contactId = contact.data[0].id;

		const response = await client.contacts.update({
			contact_id: contactId,
			name: context.propsValue.name,
			custom_attributes: context.propsValue.customAttributes,
			signed_up_at: context.propsValue.createdAt
				? dayjs(context.propsValue.createdAt).unix()
				: undefined,
			external_id: context.propsValue.userId,
			phone: context.propsValue.phone,
		});

		return response;
	},
});
