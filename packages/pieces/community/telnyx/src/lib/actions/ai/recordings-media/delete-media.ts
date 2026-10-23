import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxDeleteMediaAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_delete_media',
	displayName: 'Delete Media',
	description: 'Deletes stored media.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a stored media file by name. Cannot be undone.',
		idempotent: false,
	},
	props: {
		mediaName: Property.ShortText({
			displayName: 'Media Name',
			description: 'Name of the stored media, from Upload Media or List Media.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		await telnyxApi.deleteMedia({ auth: context.auth, mediaName: p.mediaName });
		return { success: true, media_name: p.mediaName };
	},
});
