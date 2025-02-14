import { intercomAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomClient } from '../common';
import dayjs from 'dayjs';

export const createOrUpdateLeadAction = createAction({
	auth: intercomAuth,
	name: 'create-or-update-lead',
	displayName: 'Create or Update Lead',
	description: 'Create or update an Intercom lead.If an ID is provided, the lead will be updated.',
	props: {
		leadId: Property.ShortText({
			displayName: 'Lead ID',
			required: false,
		}),
		name: Property.ShortText({
			displayName: 'Full Name',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			required: false,
		}),
		unsubscribe: Property.Checkbox({
			displayName: 'Unsubscribed From Emails',
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
		const { leadId, name, email, phone, unsubscribe, createdAt, customAttributes } =
			context.propsValue;
		const client = intercomClient(context.auth);

		if (leadId) {
			const lead = await client.contacts.search({
				query: {
					operator: 'AND',
					value: [
						{
							field: 'id',
							operator: '=',
							value: leadId,
						},
						{
							field: 'role',
							operator: '=',
							value: 'lead',
						},
					],
				},
				pagination: { per_page: 1 },
			});

			if (lead.data.length === 0) {
				throw new Error('Could not find lead with this id.');
			}

			const response = await client.contacts.update({
				contact_id: lead.data[0].id,
				name: name,
				email: email,
				phone: phone,
				unsubscribed_from_emails: unsubscribe,
				custom_attributes: customAttributes,
				signed_up_at: createdAt ? dayjs(createdAt).unix() : undefined,
			});

			return response;
		}

		const response = await client.contacts.create({
			role: 'lead',
			name: name,
			email: email,
			phone: phone,
			unsubscribed_from_emails: unsubscribe,
			custom_attributes: customAttributes,
			signed_up_at: createdAt ? dayjs(createdAt).unix() : undefined,
		});

		return response;
	},
});
