import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { subscriberId } from '../common/props';
import { manychatAuth } from '../../index';

export const sendContentToUserAction = createAction({
	auth: manychatAuth,
	name: 'sendContentToUser',
	displayName: 'Send Content to User',
	description: 'Sends a content to a user.',
	props: {
		subscriber_id: subscriberId,
		platform: Property.StaticDropdown({
			displayName: 'Platform',
			description: 'The platform to send the content to.',
			required: false,
			options: {
				options: [
					{ label: 'Facebook', value: 'facebook' },
					{ label: 'Instagram', value: 'instagram' },
					{ label: 'WhatsApp', value: 'whatsapp' },
					{ label: 'Telegram', value: 'telegram' },
				],
			},
		}),
		content_type: Property.StaticDropdown({
			displayName: 'Content Type',
			description: 'The type of content to send.',
			required: true,
			options: {
				options: [
					{ label: 'Text', value: 'text' },
					{ label: 'Image', value: 'image' },
					{ label: 'Video', value: 'video' },
					{ label: 'Audio', value: 'audio' },
					{ label: 'File', value: 'file' },
				],
			},
		}),
		text_content: Property.LongText({
			displayName: 'Text Content',
			description: 'The text content to send. Required when content type is Text.',
			required: false,
			defaultValue: '',
		}),
		media_url: Property.ShortText({
			displayName: 'Media URL',
			description:
				'URL of the media to send (image, video, audio, or file). Required for media content types.',
			required: false,
		}),
		message_tag: Property.StaticDropdown({
			displayName: 'Message Tag',
			description: 'The tag to use for the message.',
			required: false,
			options: {
				options: [
					{ label: 'Account Update', value: 'ACCOUNT_UPDATE' },
					{ label: 'Confirmed Event Update', value: 'CONFIRMED_EVENT_UPDATE' },
					{ label: 'Human Agent', value: 'HUMAN_AGENT' },
					{ label: 'Post Purchase Update', value: 'POST_PURCHASE_UPDATE' },
					{ label: 'Business Productivity', value: 'BUSINESS_PRODUCTIVITY' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const { subscriber_id, platform, content_type, text_content, media_url, message_tag } =
			propsValue;

		// Validation
		if (content_type === 'text' && !text_content) {
			throw new Error('Text content is required when content type is Text');
		}

		if (['image', 'video', 'audio', 'file'].includes(content_type) && !media_url) {
			throw new Error(`Media URL is required when content type is ${content_type}`);
		}

		// Build the content object based on the content type
		const messages = [];

		switch (content_type) {
			case 'text':
				messages.push({
					type: 'text',
					text: text_content,
				});
				break;
			case 'image':
				messages.push({
					type: 'image',
					url: media_url,
				});
				break;
			case 'video':
				messages.push({
					type: 'video',
					url: media_url,
				});
				break;
			case 'audio':
				messages.push({
					type: 'audio',
					url: media_url,
				});
				break;
			case 'file':
				messages.push({
					type: 'file',
					url: media_url,
				});
				break;
		}

		// Prepare the content object
		const content: Record<string, any> = {
			version: 'v2',
			content: {
				messages: messages,
				actions: [],
				quick_replies: [],
			},
		};

		// Add platform type if specified
		if (platform && platform !== 'facebook') {
			content['content']['type'] = platform;
		}

		// Prepare the request body
		const requestBody: Record<string, any> = {
			subscriber_id: subscriber_id,
			data: content,
		};

		if (message_tag) {
			requestBody['message_tag'] = message_tag;
		}

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: 'https://api.manychat.com/fb/sending/sendContent',
			headers: {
				accept: 'application/json',
				Authorization: `Bearer ${auth}`,
				'Content-Type': 'application/json',
			},
			body: requestBody,
		});

		return response.body;
	},
});
