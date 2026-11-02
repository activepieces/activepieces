import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsappAuth } from '../auth';
import { whatsappProps } from '../common/props';
import { whatsappClient } from '../common/client';
import { deleteMediaOutputSchema } from '../output-schemas';

export const deleteMedia = createAction({
	auth: whatsappAuth,
	name: 'delete_media',
	outputSchema: deleteMediaOutputSchema,
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Media',
	description: 'Deletes an uploaded media file from WhatsApp.',
	audience: 'both',
	aiMetadata: {
		description:
			'Permanently deletes a media file previously stored on WhatsApp by its media ID, so it can no longer be sent or downloaded. Use it to clean up after Upload Media; messages already delivered are unaffected. Not idempotent — a second call for the same ID fails because the media no longer exists.',
		idempotent: false,
	},
	props: {
		media_id: whatsappProps.mediaId,
	},
	async run(context) {
		return whatsappClient.request<{ success: boolean }>({
			accessToken: context.auth.props.access_token,
			method: HttpMethod.DELETE,
			path: `/${context.propsValue.media_id}`,
		});
	},
});
