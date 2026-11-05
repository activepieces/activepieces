import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxUpdateMediaAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_media',
	displayName: 'Update Media',
	description: 'Replaces the file or expiry of stored media.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Replaces a stored media file from a new URL and/or changes its expiry, keeping its name. Set at least one of Media URL or TTL; fields left empty are not sent.',
		idempotent: true,
	},
	props: {
		mediaName: Property.ShortText({
			displayName: 'Media Name',
			description: 'Name of the stored media, from Upload Media or List Media.',
			required: true,
		}),
		mediaUrl: Property.ShortText({
			displayName: 'Media URL',
			description: 'Public URL of the replacement file.',
			required: false,
		}),
		ttlSecs: Property.Number({
			displayName: 'TTL (seconds)',
			description: 'New number of seconds until the media expires.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		if (p.mediaUrl === undefined && p.ttlSecs === undefined) {
			throw new Error('Set at least one of Media URL or TTL (seconds).');
		}
		return await telnyxApi.updateMedia({
			auth: context.auth,
			mediaName: p.mediaName,
			body: telnyxUtils.compact({ values: { media_url: p.mediaUrl, ttl_secs: p.ttlSecs } }),
		});
	},
});
