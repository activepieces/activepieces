import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { manychatAuth } from '../auth';
import { manychatClient, manychatUtils } from '../common/client';
import { manychatInput, subscriberId } from '../common/props';
import { manychatOutputSchemas } from '../common/output-schemas';

export const sendContentToUserAction = createAction({
	auth: manychatAuth,
	name: 'sendContentToUser',
	classification: 'WRITE',
	displayName: 'Send Content to Subscriber',
	description: 'Sends a text, image, video, audio or file message to a subscriber.',
	audience: 'both',
	aiMetadata: {
		description:
			'Sends one message to a ManyChat subscriber by subscriber ID: text, or an image, video, audio or file by public URL. Use for a single ad-hoc message; to run a prepared ManyChat flow use "Send Flow to Subscriber". The subscriber must have interacted in the last 24 hours unless a Message Tag applies (Messenger only), otherwise ManyChat rejects it with code 3011. Each call sends another message.',
		idempotent: false,
	},
	outputSchema: manychatOutputSchemas.sendContent,
	propertyGroups: [
		{ key: 'recipient', display: 'section', label: 'Send To', icon: 'send', props: ['window_info', 'subscriber_id', 'platform'] },
		{ key: 'message', display: 'section', label: 'Message', icon: 'text', props: ['content_type', 'text_content', 'media_url'] },
	],
	props: {
		window_info: Property.MarkDown({
			value: 'The subscriber must have messaged you in the last 24 hours. On Messenger, a Message Tag under Advanced lifts this.',
			variant: MarkdownVariant.INFO,
		}),
		subscriber_id: subscriberId,
		platform: Property.StaticDropdown({
			displayName: 'Platform',
			description: 'Leave empty to send on Messenger.',
			required: false,
			options: {
				options: [
					{ label: 'Messenger', value: 'facebook' },
					{ label: 'Instagram', value: 'instagram' },
					{ label: 'WhatsApp', value: 'whatsapp' },
					{ label: 'Telegram', value: 'telegram' },
				],
			},
		}),
		content_type: Property.StaticDropdown({
			displayName: 'Content Type',
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
			displayName: 'Message Text',
			description: 'Required when Content Type is Text.',
			required: false,
			defaultValue: '',
		}),
		media_url: Property.ShortText({
			displayName: 'Media URL',
			description: 'Public URL of the file. Required for Image, Video, Audio and File.',
			placeholder: 'https://example.com/photo.jpg',
			required: false,
		}),
		message_tag: Property.StaticDropdown({
			displayName: 'Message Tag',
			description: 'Lets Messenger deliver outside the 24-hour window. Others ignore it.',
			required: false,
			advanced: true,
			options: {
				options: [
					{ label: 'Account Update', value: 'ACCOUNT_UPDATE' },
					{ label: 'Confirmed Event Update', value: 'CONFIRMED_EVENT_UPDATE' },
					{ label: 'Human Agent', value: 'HUMAN_AGENT' },
					{ label: 'Post Purchase Update', value: 'POST_PURCHASE_UPDATE' },
					{ label: 'Business Productivity (legacy)', value: 'BUSINESS_PRODUCTIVITY' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const { subscriber_id, platform, content_type, text_content, media_url, message_tag } = propsValue;
		const id = manychatInput.subscriberIdText({ value: subscriber_id, label: 'Subscriber ID' });
		const text = manychatInput.optionalText(text_content);
		const mediaUrl = manychatInput.optionalText(media_url);
		if (content_type === 'text' && text === undefined) {
			throw new Error('Message Text is required when Content Type is Text.');
		}
		if (MEDIA_TYPES.includes(content_type) && mediaUrl === undefined) {
			throw new Error(`Media URL is required when Content Type is ${MEDIA_LABELS[content_type] ?? content_type}.`);
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

const MEDIA_LABELS: Record<string, string> = {
	image: 'Image',
	video: 'Video',
	audio: 'Audio',
	file: 'File',
};
