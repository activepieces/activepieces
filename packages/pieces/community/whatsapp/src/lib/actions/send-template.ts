import { createAction, Property } from '@activepieces/pieces-framework';
import { whatsappAuth } from '../auth';
import { commonProps } from '../common/utils';
import { whatsappProps } from '../common/props';
import { whatsappClient } from '../common/client';
import { inputUtils } from '../common/inputs';
import { messageSendOutputSchema } from '../output-schemas';

export const sendTemplate = createAction({
	auth: whatsappAuth,
	name: 'send_template',
	outputSchema: messageSendOutputSchema,
	classification: 'WRITE',
	displayName: 'Send Template',
	description: 'Sends an approved template by name with positional parameters.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Sends a pre-approved WhatsApp message template identified by its name and language code, filling the numbered {{1}}, {{2}} placeholders from plain parameter lists for the header, body and URL button. Use this to start a conversation outside the 24-hour window or for notifications; resolve the template name, language and placeholder count with List Message Templates first. Only text parameters are supported. Not idempotent — each call sends a new message.',
		idempotent: false,
	},
	props: {
		phone_number_id: commonProps.phone_number_id,
		to: whatsappProps.to,
		template_name: Property.ShortText({
			displayName: 'Template Name',
			description: 'Exact template name, for example hello_world. Get it from List Message Templates.',
			required: true,
		}),
		language_code: Property.ShortText({
			displayName: 'Language Code',
			description: 'Language and locale of the approved template, for example en_US.',
			required: true,
			defaultValue: 'en_US',
		}),
		body_parameters: Property.Array({
			displayName: 'Body Parameters',
			description: 'Values for the body placeholders, in order: the first entry fills {{1}}, the second {{2}}.',
			required: false,
		}),
		header_parameters: Property.Array({
			displayName: 'Header Parameters',
			description: 'Values for text header placeholders, in order.',
			required: false,
		}),
		button_url_parameters: Property.Array({
			displayName: 'Button URL Parameters',
			description: 'Values for the dynamic URL suffix of the first URL button, in order.',
			required: false,
		}),
		reply_to_message_id: whatsappProps.replyToMessageId,
	},
	async run(context) {
		const { phone_number_id, to, template_name, language_code, body_parameters, header_parameters, button_url_parameters, reply_to_message_id } =
			context.propsValue;
		const body = inputUtils.asStrings(body_parameters);
		const header = inputUtils.asStrings(header_parameters);
		const button = inputUtils.asStrings(button_url_parameters);
		const components = [
			...(header.length > 0 ? [{ type: 'header', parameters: textParameters(header) }] : []),
			...(body.length > 0 ? [{ type: 'body', parameters: textParameters(body) }] : []),
			...(button.length > 0 ? [{ type: 'button', sub_type: 'url', index: 0, parameters: textParameters(button) }] : []),
		];
		return whatsappClient.sendMessage({
			accessToken: context.auth.props.access_token,
			phoneNumberId: phone_number_id,
			to,
			replyToMessageId: reply_to_message_id,
			payload: {
				type: 'template',
				template: {
					name: template_name,
					language: { code: language_code },
					...(components.length > 0 ? { components } : {}),
				},
			},
		});
	},
});

function textParameters(values: string[]): { type: 'text'; text: string }[] {
	return values.map((text) => ({ type: 'text', text }));
}
