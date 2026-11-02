import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsappAuth } from '../auth';
import { whatsappProps } from '../common/props';
import { whatsappClient } from '../common/client';
import { getMediaUrlOutputSchema } from '../output-schemas';

export const getMediaUrl = createAction({
	auth: whatsappAuth,
	name: 'get_media_url',
	outputSchema: getMediaUrlOutputSchema,
	classification: 'READ',
	displayName: 'Get Media URL',
	description: 'Looks up a media ID and returns its download URL and metadata.',
	audience: 'both',
	aiMetadata: {
		description:
			'Resolves a WhatsApp media ID to its temporary download URL, MIME type, size and SHA-256 hash. The URL expires after five minutes and needs the access token to fetch, so prefer Download Media when you want the file itself. Idempotent — a pure read.',
		idempotent: true,
	},
	props: {
		media_id: whatsappProps.mediaId,
	},
	async run(context) {
		return whatsappClient.request<MediaInfo>({
			accessToken: context.auth.props.access_token,
			method: HttpMethod.GET,
			path: `/${context.propsValue.media_id}`,
		});
	},
});

export type MediaInfo = {
	messaging_product: string;
	url: string;
	mime_type: string;
	sha256: string;
	file_size: number;
	id: string;
};
