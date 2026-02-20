import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { whatsappOrderNotificationAuth } from '../common/auth';

export const groupSend = createAction({
	auth: whatsappOrderNotificationAuth,
	name: 'groupSend',
	displayName: 'Send WhatsApp Message To Group',
	description: 'Sends a WhatsApp message to the specified Group',
	props: {
		number: Property.ShortText({
			displayName: 'Group ID / Number',
			description: `Enter your WhatsApp group ID here. Need help? [View the step-by-step guide](https://assistro.co/user-guide/zapier/how-to-send-message-to-a-whatsapp-group-guide-to-fetch-group-id/) to get your Group ID. E.g. 12XXXXXX482@g.us`,
			required: true,
		}),
		message: Property.LongText({
			displayName: 'Message',
			description: 'Enter the message here. E.g. Hello Team!',
			required: true,
		}),
		media: Property.Array({
			displayName: 'Media Attachments',
			description: 'Add multiple media files (each with base64 data and file name)',
			required: false,
			properties: {
				media_base64: Property.LongText({
					displayName: 'Media Base64',
					description: 'Base64 string of the media file',
					required: true,
				}),
				file_name: Property.ShortText({
					displayName: 'File Name',
					description: 'Name of the file (e.g., image.jpg, document.pdf)',
					required: true,
				}),
			},
		}),
	},
	async run(context) {
		const { number, message, media } = context.propsValue;
		const token = context.auth.secret_text;

		const mediaArray: any[] = [];
		if (media && media.length > 0) {
			for (let i = 0; i < media.length; i++) {
				const item = media[i] as { media_base64: string; file_name: string };
				mediaArray.push({
					media_base64: item.media_base64,
					file_name: item.file_name,
				});
			}
		}

		const msgs: any[] = [
			{
				number: number,
				message: message,
				type: 2,
				media: mediaArray,
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
