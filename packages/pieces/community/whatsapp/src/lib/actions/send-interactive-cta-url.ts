import { createAction, Property } from '@activepieces/pieces-framework';
import { whatsappAuth } from '../auth';
import { commonProps } from '../common/utils';
import { whatsappProps } from '../common/props';
import { whatsappClient } from '../common/client';
import { inputUtils } from '../common/inputs';
import { messageSendOutputSchema } from '../output-schemas';

export const sendInteractiveCtaUrl = createAction({
	auth: whatsappAuth,
	name: 'send_interactive_cta_url',
	outputSchema: messageSendOutputSchema,
	classification: 'WRITE',
	displayName: 'Send Interactive CTA URL',
	description: 'Sends a message with a single button that opens a web link.',
	audience: 'both',
	aiMetadata: {
		description:
			'Sends a WhatsApp message with one call-to-action button that opens a URL, without needing an approved template. Choose this over Send Message when the recipient should tap through to a page rather than read a raw link. Free-form, so it only delivers inside the 24-hour customer service window. Not idempotent — each call sends a new message.',
		idempotent: false,
	},
	props: {
		phone_number_id: commonProps.phone_number_id,
		to: whatsappProps.to,
		body: whatsappProps.bodyText,
		button_text: Property.ShortText({
			displayName: 'Button Text',
			description: 'Label of the button. Max 20 characters.',
			required: true,
		}),
		url: Property.ShortText({
			displayName: 'Button URL',
			description: 'The link the button opens.',
			required: true,
		}),
		header_type: whatsappProps.interactiveHeaderType,
		header_text: whatsappProps.interactiveHeaderText,
		header_media_url: whatsappProps.interactiveHeaderMediaUrl,
		footer: whatsappProps.footerText,
		reply_to_message_id: whatsappProps.replyToMessageId,
	},
	async run(context) {
		const { phone_number_id, to, body, button_text, url, header_type, header_text, header_media_url, footer, reply_to_message_id } =
			context.propsValue;
		inputUtils.assertMaxLength({ value: button_text, maxLength: 20, label: 'Button text' });
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
					type: 'cta_url',
					...(header ? { header } : {}),
					body: { text: body },
					...(footer ? { footer: { text: footer } } : {}),
					action: {
						name: 'cta_url',
						parameters: { display_text: button_text, url },
					},
				},
			},
		});
	},
});
