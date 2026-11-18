import { createAction, Property } from '@activepieces/pieces-framework';
import { whatsappAuth } from '../auth';
import { commonProps } from '../common/utils';
import { whatsappProps } from '../common/props';
import { whatsappClient } from '../common/client';
import { inputUtils } from '../common/inputs';
import { messageSendOutputSchema } from '../output-schemas';

export const sendInteractiveButtons = createAction({
	auth: whatsappAuth,
	name: 'send_interactive_buttons',
	outputSchema: messageSendOutputSchema,
	classification: 'WRITE',
	displayName: 'Send Interactive Buttons',
	description: 'Sends a message with up to three quick-reply buttons.',
	audience: 'both',
	aiMetadata: {
		description:
			'Sends a WhatsApp message with up to three tappable reply buttons; the recipient tap arrives as an incoming interactive message carrying the button id. Choose this over Send Message when you need a structured yes/no or menu-style answer, and over Send Interactive List when there are three options or fewer. Free-form, so it only delivers inside the 24-hour customer service window. Not idempotent — each call sends a new message.',
		idempotent: false,
	},
	props: {
		phone_number_id: commonProps.phone_number_id,
		to: whatsappProps.to,
		body: whatsappProps.bodyText,
		buttons: Property.Array({
			displayName: 'Buttons',
			description: 'Between one and three buttons. Titles must be unique and at most 20 characters.',
			required: true,
			properties: {
				id: Property.ShortText({
					displayName: 'Button ID',
					description: 'Returned to you when the recipient taps this button. Max 256 characters.',
					required: true,
				}),
				title: Property.ShortText({
					displayName: 'Title',
					description: 'Text on the button. Max 20 characters, unique across the buttons.',
					required: true,
				}),
			},
		}),
		header_type: whatsappProps.interactiveHeaderType,
		header_text: whatsappProps.interactiveHeaderText,
		header_media_url: whatsappProps.interactiveHeaderMediaUrl,
		footer: whatsappProps.footerText,
		reply_to_message_id: whatsappProps.replyToMessageId,
	},
	async run(context) {
		const { phone_number_id, to, body, buttons, header_type, header_text, header_media_url, footer, reply_to_message_id } =
			context.propsValue;
		const buttonEntries = inputUtils.asRecords(buttons).map((entry) => ({
			id: inputUtils.requiredString({ record: entry, key: 'id', label: 'Button ID', maxLength: 256 }),
			title: inputUtils.requiredString({ record: entry, key: 'title', label: 'Button title', maxLength: 20 }),
		}));
		if (buttonEntries.length < 1 || buttonEntries.length > 3) {
			throw new Error('Interactive button messages need between 1 and 3 buttons.');
		}
		inputUtils.assertUnique({ values: buttonEntries.map((button) => button.title), label: 'Button titles' });
		inputUtils.assertUnique({ values: buttonEntries.map((button) => button.id), label: 'Button IDs' });
		inputUtils.assertMaxLength({ value: body, maxLength: 1024, label: 'Body' });
		inputUtils.assertMaxLength({ value: footer, maxLength: 60, label: 'Footer' });
		inputUtils.assertMaxLength({ value: header_text, maxLength: 60, label: 'Header text' });
		const header = whatsappClient.buildInteractiveHeader({
			headerType: header_type,
			headerText: header_text,
			headerMediaUrl: header_media_url,
		});
		return whatsappClient.sendMessage({
			accessToken: context.auth.props.access_token,
			phoneNumberId: phone_number_id,
			to,
			replyToMessageId: reply_to_message_id,
			payload: {
				type: 'interactive',
				interactive: {
					type: 'button',
					...(header ? { header } : {}),
					body: { text: body },
					...(footer ? { footer: { text: footer } } : {}),
					action: {
						buttons: buttonEntries.map((button) => ({
							type: 'reply',
							reply: { id: button.id, title: button.title },
						})),
					},
				},
			},
		});
	},
});
