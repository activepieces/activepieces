import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { whatsappAuth } from '../auth';
import { commonProps } from '../common/utils';

export const sendMessage = createAction({
	auth: whatsappAuth,
	name: 'sendMessage',
	displayName: 'Send Message',
	description: 'Send a text message through WhatsApp',
	audience: 'both',
	aiMetadata: { description: 'Sends a plain text WhatsApp message from a business phone number to a single recipient via the WhatsApp Cloud API. Choose this for free-form text replies or notifications when no media or pre-approved template is needed; for media use Send Media and for marketing/utility templates use Send Template Message. Requires the sender phone number ID and the recipient phone number in international format; outside the 24-hour customer service window only template messages are deliverable. Not idempotent — each call delivers a new message.', idempotent: false },
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
		const { access_token } = context.auth.props;
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
