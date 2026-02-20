import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { whatsappOrderNotificationAuth } from '../common/auth';

export const channelSend = createAction({
	auth: whatsappOrderNotificationAuth,
	name: 'channelSend',
	displayName: 'Send WhatsApp Message To Channel/Newsletter',
	description: 'Sends a WhatsApp message to the specified Channel/Newsletter',
	props: {
		number: Property.ShortText({
			displayName: 'Channel ID / Newsletter ID',
			description: `Enter your WhatsApp channel/newsletter ID here. Need help? [View the step-by-step guide](https://assistro.co/user-guide/zapier/how-to-send-message-to-a-whatsapp-channel-guide-to-fetch-newsletter-channel-id/) to get your Channel/Newsletter ID. E.g. 12XXXXXX482@newsletter`,
			required: true,
		}),
		message: Property.LongText({
			displayName: 'Message',
			description: 'Enter the message here. E.g. Hello Team!',
			required: true,
		}),
	},
	async run(context) {
		const { number, message } = context.propsValue;
		const token = context.auth.secret_text;

		const msgs: any[] = [
			{
				number: number,
				message: message,
				type: 3,
			},
		];

		return await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: 'https://app.assistro.co/api/v1/wapushplus/single/message',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
				'Integration': 'Custom',
			},
			body: {
				msgs: msgs,
			},
		});
	},
});
