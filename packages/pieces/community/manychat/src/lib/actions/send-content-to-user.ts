import { createAction, Property } from '@activepieces/pieces-framework';
import { manychatAuth } from '../auth';
import { manychatClient, manychatUtils } from '../common/client';
import { manychatInput, subscriberId } from '../common/props';
import { manychatOutputSchemas } from '../common/output-schemas';

export const sendContentToUserAction = createAction({
	auth: manychatAuth,
	name: 'sendContentToUser',
	classification: 'WRITE',
	displayName: 'Send Content to User',
	description:
		'Sends a text or media message to a user. Messenger only delivers outside the 24-hour window when a Message Tag is set.',
	audience: 'both',
	aiMetadata: {
		description:
			'Sends one message to a ManyChat subscriber by subscriber ID: text, or an image, video, audio or file by public URL. Use for a single ad-hoc message; to run a prepared ManyChat flow use "Send Flow to Subscriber". The subscriber must have interacted in the last 24 hours unless a Message Tag applies (Messenger only), otherwise ManyChat rejects it with code 3011. Each call sends another message.',
		idempotent: false,
	},
	outputSchema: manychatOutputSchemas.sendContent,
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
			description:
				'Messenger message tag that allows sending outside the 24-hour window. Instagram and WhatsApp ignore it. Meta no longer accepts Business Productivity; it is kept only for existing flows.',
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
		const { subscriber_id, platform, content_type, text_content, media_url, message_tag } = propsValue;
		const id = manychatInput.subscriberIdText({ value: subscriber_id, label: 'User ID' });
		const text = manychatInput.optionalText(text_content);
		const mediaUrl = manychatInput.optionalText(media_url);
		if (content_type === 'text' && text === undefined) {
			throw new Error('Text content is required when content type is Text');
		}
		if (MEDIA_TYPES.includes(content_type) && mediaUrl === undefined) {
			throw new Error(`Media URL is required when content type is ${content_type}`);
		}
		if (content_type !== 'text' && !MEDIA_TYPES.includes(content_type)) {
			throw new Error(`Unsupported content type "${content_type}".`);
		}
		const message = content_type === 'text' ? { type: 'text', text } : { type: content_type, url: mediaUrl };
		const content: Record<string, unknown> = {
			messages: [message],
			actions: [],
			quick_replies: [],
		};
		if (platform && platform !== 'facebook') {
			content['type'] = platform;
		}
		const body = await manychatClient.request({
			apiKey: manychatUtils.apiKeyOf(auth),
			method: 'POST',
			path: '/sending/sendContent',
			operation: 'send content',
			body: {
				subscriber_id: manychatInput.apiId(id),
				data: { version: 'v2', content },
				...(message_tag ? { message_tag } : {}),
			},
		});
		return manychatUtils.recordOf(body);
	},
});

const MEDIA_TYPES = ['image', 'video', 'audio', 'file'];
