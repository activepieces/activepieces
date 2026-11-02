import { createAction, Property } from '@activepieces/pieces-framework';
import { whatsappAuth } from '../auth';
import { commonProps } from '../common/utils';
import { whatsappProps } from '../common/props';
import { whatsappClient } from '../common/client';
import { inputUtils } from '../common/inputs';
import { messageSendOutputSchema } from '../output-schemas';

export const sendInteractiveList = createAction({
	auth: whatsappAuth,
	name: 'send_interactive_list',
	outputSchema: messageSendOutputSchema,
	classification: 'WRITE',
	displayName: 'Send Interactive List',
	description: 'Sends a message that opens a menu of up to ten selectable rows.',
	audience: 'both',
	aiMetadata: {
		description:
			'Sends a WhatsApp list message: a button that opens a menu of up to ten rows grouped in sections, and the recipient selection arrives as an incoming interactive message carrying the row id. Choose this over Send Interactive Buttons when there are more than three options. Free-form, so it only delivers inside the 24-hour customer service window. Not idempotent — each call sends a new message.',
		idempotent: false,
	},
	props: {
		phone_number_id: commonProps.phone_number_id,
		to: whatsappProps.to,
		body: whatsappProps.bodyText,
		button_text: Property.ShortText({
			displayName: 'Button Text',
			description: 'Label of the button that opens the list. Max 20 characters.',
			required: true,
		}),
		section_title: Property.ShortText({
			displayName: 'Section Title',
			description: 'Title shown above the rows. Max 24 characters.',
			required: true,
		}),
		rows: Property.Array({
			displayName: 'Rows',
			description: 'Between one and ten rows. Titles max 24 characters, descriptions max 72.',
			required: true,
			properties: {
				id: Property.ShortText({
					displayName: 'Row ID',
					description: 'Returned to you when the recipient selects this row. Max 200 characters.',
					required: true,
				}),
				title: Property.ShortText({
					displayName: 'Title',
					required: true,
				}),
				description: Property.ShortText({
					displayName: 'Description',
					required: false,
				}),
			},
		}),
		header_text: whatsappProps.interactiveHeaderText,
		footer: whatsappProps.footerText,
		reply_to_message_id: whatsappProps.replyToMessageId,
	},
	async run(context) {
		const { phone_number_id, to, body, button_text, section_title, rows, header_text, footer, reply_to_message_id } =
			context.propsValue;
		const rowEntries = inputUtils.asRecords(rows).map((entry) => ({
			id: inputUtils.requiredString({ record: entry, key: 'id', label: 'Row ID', maxLength: 200 }),
			title: inputUtils.requiredString({ record: entry, key: 'title', label: 'Row title', maxLength: 24 }),
			description: inputUtils.optionalString({ record: entry, key: 'description', label: 'Row description', maxLength: 72 }),
		}));
		if (rowEntries.length < 1 || rowEntries.length > 10) {
			throw new Error('Interactive list messages need between 1 and 10 rows.');
		}
		inputUtils.assertUnique({ values: rowEntries.map((row) => row.id), label: 'Row IDs' });
		inputUtils.assertMaxLength({ value: button_text, maxLength: 20, label: 'Button text' });
		inputUtils.assertMaxLength({ value: section_title, maxLength: 24, label: 'Section title' });
		inputUtils.assertMaxLength({ value: body, maxLength: 4096, label: 'Body' });
		inputUtils.assertMaxLength({ value: footer, maxLength: 60, label: 'Footer' });
		inputUtils.assertMaxLength({ value: header_text, maxLength: 60, label: 'Header text' });
		return whatsappClient.sendMessage({
			accessToken: context.auth.props.access_token,
			phoneNumberId: phone_number_id,
			to,
			replyToMessageId: reply_to_message_id,
			payload: {
				type: 'interactive',
				interactive: {
					type: 'list',
					...(header_text ? { header: { type: 'text', text: header_text } } : {}),
					body: { text: body },
					...(footer ? { footer: { text: footer } } : {}),
					action: {
						button: button_text,
						sections: [
							{
								title: section_title,
								rows: rowEntries.map((row) => ({
									id: row.id,
									title: row.title,
									...(row.description ? { description: row.description } : {}),
								})),
							},
						],
					},
				},
			},
		});
	},
});
