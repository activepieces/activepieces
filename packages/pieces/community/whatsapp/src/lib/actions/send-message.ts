import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { whatsappAuth } from '../..';
import { commonProps } from '../common/utils';

export const sendMessage = createAction({
	auth: whatsappAuth,
	name: 'sendMessage',
	displayName: 'Send Message',
	description: 'Send a text message through WhatsApp',
	props: {
		phone_number_id: commonProps.phone_number_id,
		to: Property.ShortText({
			displayName: 'To',
			description: 'The recipient of the message',
			required: true,
		}),
		text: Property.LongText({
			displayName: 'Message',
			description: 'The message to send',
			required: true,
		}),
	},
	async run(context) {
		const { to, text, phone_number_id } = context.propsValue;
		const { access_token } = context.auth;
		return await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
			headers: {
				Authorization: 'Bearer ' + access_token,
			},
			body: {
				messaging_product: 'whatsapp',
				recipient_type: 'individual',
				to,
				type: 'text',
				text: {
					body: text,
				},
			},
		});
	},
});
