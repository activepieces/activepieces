import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { commonProps, intercomClient } from '../common';
import { intercomAuth } from '../..';

export const sendMessageAction = createAction({
	auth: intercomAuth,
	description: 'Send a message to a contact (only allowed by admins)',
	displayName: 'Send Message',
	name: 'send_message',
	props: {
		message_type: Property.StaticDropdown({
			displayName: 'Message Type',
			options: {
				options: [
					{ value: 'email', label: 'Email' },
					{ value: 'inapp', label: 'In App Chat' },
				],
			},
			required: true,
			defaultValue: 'email',
		}),
		email_required_fields: Property.DynamicProperties({
			displayName: 'Email Required Fields',
			required: true,
			refreshers: ['message_type'],
			props: async ({ message_type }) => {
				let fields: DynamicPropsValue = {};
				if ((message_type as unknown as string) === 'email' || !message_type) {
					fields = {
						subject: Property.ShortText({
							displayName: 'Subject',
							required: true,
							description: 'Email title',
						}),
						template: Property.StaticDropdown({
							displayName: 'Template',
							options: {
								options: [
									{ label: 'Personal', value: 'personal' },
									{ label: 'Plain', value: 'plain' },
								],
							},
							required: true,
							defaultValue: 'personal',
							description: 'Style of the email',
						}),
					};
				}
				return fields;
			},
		}),
		from: commonProps.admins({ displayName: 'From (Admin)', required: true }),
		to: commonProps.contacts({ displayName: 'To', required: true }),
		body: Property.ShortText({
			displayName: 'Message Body',
			required: true,
		}),
		create_conversation_without_contact_reply: Property.Checkbox({
			displayName: 'Create Conversation Without Contact Reply',
			description:
				'Whether a conversation should be opened in the inbox for the message without the contact replying. Defaults to false if not provided.',
			required: false,
			defaultValue: false,
		}),
	},
	run: async (context) => {
		const client = intercomClient(context.auth);
		const user = await client.contacts.find({ contact_id: context.propsValue.to });

		const response = await client.messages.create({
			message_type: context.propsValue.message_type as 'email' | 'inapp',
			from: { id: Number(context.propsValue.from), type: 'admin' },
			to: {
				id: context.propsValue.to,
				type: user.role === 'user' ? 'user' : 'lead',
			},
			template: context.propsValue.email_required_fields['template'],
			subject: context.propsValue.email_required_fields['subject'],
			create_conversation_without_contact_reply:
				context.propsValue.create_conversation_without_contact_reply,
			body: context.propsValue.body,
		});

		return response;
	},
});
