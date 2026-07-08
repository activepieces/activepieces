import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { typefullyAuth } from '../auth';
import { typefullyApiCall } from '../common/client';
import { socialSetDropdown } from '../common/props';

export const uploadMediaAction = createAction({
	auth: typefullyAuth,
	name: 'typefully_upload_media',
	displayName: 'Upload Media',
	description:
		'Uploads a media file (image, video, GIF, or PDF) to Typefully. Returns a media ID that can be used when creating drafts.',
	audience: 'both',
	aiMetadata: {
		description:
			'Uploads a media file (image, video, GIF, or PDF) to a Typefully social set and returns a media ID to reference when attaching media to drafts created via Create Draft Advanced. Use as a prerequisite step before building a draft that includes media. Requires the social set ID and the file. Each call uploads a new file, so it is not idempotent.',
		idempotent: false,
	},
	props: {
		social_set_id: socialSetDropdown,
		file: Property.File({
			displayName: 'File',
			description: 'The media file to upload (image, video, GIF, or PDF).',
			required: true,
		}),
	},
	async run(context) {
		const { social_set_id, file } = context.propsValue;

		const { media_id, upload_url } = await typefullyApiCall<{
			media_id: string;
			upload_url: string;
		}>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/social-sets/${social_set_id}/media/upload`,
			body: { file_name: file.filename },
		});

		await httpClient.sendRequest({
			method: HttpMethod.PUT,
			url: upload_url,
			body: file.data,
		});

		return { media_id };
	},
});
