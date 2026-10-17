import { createAction, Property } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';

export const uploadMediaAction = createAction({
	auth: runwareAuth,
	name: 'runware_upload_media',
	displayName: 'Upload Media',
	description: 'Stores an image, video, audio or 3D file in Runware and returns its UUID.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Stores media (image, video, audio or 3D model) in the Runware account from a public URL, data URI or base64 and returns a reusable mediaUUID and mediaURL, which any action input that takes media accepts. Delete it later with Delete Media.',
		idempotent: false,
	},
	props: {
		media: Property.LongText({
			displayName: 'Media',
			description: 'The file as a public URL, a data URI or a base64 string.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await runwareApi.runTask({
			auth,
			task: { taskType: 'mediaStorage', operation: 'upload', media: propsValue.media },
		});
	},
});
