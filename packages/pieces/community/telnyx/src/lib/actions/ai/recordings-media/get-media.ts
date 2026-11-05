import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetMediaAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_media',
	displayName: 'Get Media',
	description: 'Gets details of stored media.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one stored media file by name: content type, creation time and expiry. The file content itself is not returned.',
		idempotent: true,
	},
	props: {
		mediaName: Property.ShortText({
			displayName: 'Media Name',
			description: 'Name of the stored media, from Upload Media or List Media.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.getMedia({
			auth: context.auth,
			mediaName: context.propsValue.mediaName,
		});
	},
});
