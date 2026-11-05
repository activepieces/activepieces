import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListMediaAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_media',
	displayName: 'List Media',
	description: 'Lists media files stored on Telnyx.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the media files stored on Telnyx (used for MMS, call audio and fax) with their name, content type and expiry. Optionally filter by content type.',
		idempotent: true,
	},
	props: {
		contentType: Property.ShortText({
			displayName: 'Content Type',
			description: 'Only return media of this content type, e.g. "audio/mpeg".',
			required: false,
		}),
	},
	async run(context) {
		return await telnyxApi.listMedia({
			auth: context.auth,
			query: telnyxUtils.toQuery({
				values: { 'filter[content_type][]': context.propsValue.contentType },
			}),
		});
	},
});
