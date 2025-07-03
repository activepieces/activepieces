import { intercomAuth } from '../../index';
import {
	createAction,
	DropdownOption,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';
import { intercomClient } from '../common';

export const createConversationAction = createAction({
	auth: intercomAuth,
	name: 'create-conversation',
	displayName: 'Create Conversation',
	description: 'Creates a new conversation from a contact.',
	props: {
		contactType: Property.StaticDropdown({
			displayName: 'Contact Type',
			required: true,
			defaultValue: 'user',
			options: {
				disabled: false,
				options: [
					{ value: 'user', label: 'User' },
					{ value: 'lead', label: 'Lead' },
				],
			},
		}),
		contactId: Property.Dropdown({
			displayName: 'Contact ID',
			required: true,
			refreshers: ['contactType'],
			options: async ({ auth, contactType }) => {
				if (!auth || !contactType) {
					return {
						options: [],
						disabled: true,
						placeholder: 'Please connect your account first.',
					};
				}

				const type = contactType as 'user' | 'lead';
				const authValue = auth as PiecePropValueSchema<typeof intercomAuth>;
				const client = intercomClient(authValue);

				const response = await client.contacts.list();
				const options: DropdownOption<string>[] = [];

				for await (const contact of response) {
					if (contact.role === type) {
						options.push({
							value: contact.id,
							label: `${contact.name ?? ''}, ${contact.email}, ${contact.external_id ?? ''}`,
						});
					}
				}
				return {
					disabled: false,
					options,
				};
			},
		}),
		body: Property.LongText({
			displayName: 'Message Body',
			required: true,
		}),
	},
	async run(context) {
		const { contactId, body, contactType } = context.propsValue;

		const client = intercomClient(context.auth);

		const response = await client.conversations.create({
			body,
			from: {
				type: contactType as 'lead' | 'user' | 'contact',
				id: contactId,
			},
		});

		return response;
	},
});
