import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxUploadMediaAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_upload_media',
	displayName: 'Upload Media',
	description: 'Stores a media file on Telnyx from a URL.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Downloads a file from a public URL and stores it on Telnyx under a media name, for use as MMS media, call audio or fax content. Media expires after TTL seconds (default 48 hours). Not idempotent.',
		idempotent: false,
	},
	props: {
		mediaUrl: Property.ShortText({
			displayName: 'Media URL',
			description: 'Public URL of the file to store.',
			required: true,
		}),
		mediaName: Property.ShortText({
			displayName: 'Media Name',
			description: 'Optional unique name for the media. Generated if empty.',
			required: false,
		}),
		ttlSecs: Property.Number({
			displayName: 'TTL (seconds)',
			description: 'Seconds until the media expires. Defaults to 172800 (48 hours).',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.uploadMedia({
			auth: context.auth,
			body: telnyxUtils.compact({
				values: { media_url: p.mediaUrl, media_name: p.mediaName, ttl_secs: p.ttlSecs },
			}),
		});
	},
});
