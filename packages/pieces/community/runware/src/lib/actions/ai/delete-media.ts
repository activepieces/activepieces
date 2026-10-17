import { createAction, Property } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';

export const deleteMediaAction = createAction({
	auth: runwareAuth,
	name: 'runware_delete_media',
	displayName: 'Delete Media',
	description: 'Permanently deletes stored media by UUID.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes media stored in the Runware account, by the mediaUUID that Upload Media returned. This cannot be undone.',
		idempotent: false,
	},
	props: {
		mediaUUID: Property.ShortText({
			displayName: 'Media UUID',
			description: 'The mediaUUID returned by Upload Media.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await runwareApi.runTask({
			auth,
			task: { taskType: 'mediaStorage', operation: 'delete', media: propsValue.mediaUUID },
		});
	},
});
