import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { whatsappAuth } from '../auth';
import {
	supportedMediaTypes,
	capitalizeFirstLetter,
	mediaTypeSupportsCaption,
	commonProps,
} from '../common/utils';

export const sendMedia = createAction({
	auth: whatsappAuth,
	name: 'sendMedia',
	classification: 'WRITE',
	displayName: 'Send Media',
	description: 'Send an image, video, audio, document or sticker by URL.',
	audience: 'both',
	aiMetadata: { description: 'Sends an image, video, audio, document, or sticker to a WhatsApp recipient by referencing the media via a public URL. Choose this when the message payload is a file rather than plain text; captions are supported for media types that allow them and a filename can be set for documents. Requires the sender phone number ID, recipient phone number, media type, and a reachable media URL; subject to WhatsApp messaging-window rules. Not idempotent — each call delivers a new message.', idempotent: false },
	props: {
		phone_number_id: commonProps.phone_number_id,
		to: Property.ShortText({
			displayName: 'To',
			description: "Recipient's phone number in international format.",
			placeholder: '15551234567',
			required: true,
		}),
		type: Property.Dropdown({
			auth: whatsappAuth,
			displayName: 'Media Type',
			description: 'What kind of file the URL points to.',
			required: true,
			options: async () => {
				return {
					options: supportedMediaTypes.map((type) => ({
						label: capitalizeFirstLetter(type),
						value: type,
					})),
				};
			},
			refreshers: [],
		}),
		media: Property.ShortText({
			displayName: 'Media URL',
			description: 'Public link WhatsApp downloads when it sends the message.',
			placeholder: 'https://example.com/photo.jpg',
			required: true,
		}),
		caption: Property.LongText({
			displayName: 'Caption',
			description: 'Text shown under the media. Ignored for audio and stickers.',
			required: false,
		}),
		filename: Property.LongText({
			displayName: 'Filename',
			description: 'Documents only: the file name the recipient sees.',
			required: false,
			advanced: true,
		}),
	},
	async run(context) {
		const { to, caption, media, type, filename, phone_number_id } = context.propsValue;
		const { access_token } = context.auth.props;
		const body = {
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to,
			type,
			[type]: {
				link: media,
			},
		};
		if (caption && mediaTypeSupportsCaption(type)) (body[type] as any).caption = caption;
		if (filename && type === 'document') (body[type] as any).filename = filename;
		return await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
			headers: {
				Authorization: 'Bearer ' + access_token,
			},
			body,
		});
	},
});
