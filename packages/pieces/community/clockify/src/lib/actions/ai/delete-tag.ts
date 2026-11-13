import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { tagOutputSchema } from '../../output-schemas';

export const deleteTagAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_delete_tag',
	outputSchema: tagOutputSchema,
	displayName: 'Delete Tag',
	description: 'Deletes a tag.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a tag and removes it from every time entry that used it.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		tagId: clockifyAiProps.tagId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.deleteTag({
			auth,
			workspaceId: propsValue.workspaceId,
			tagId: propsValue.tagId,
		});
	},
});
