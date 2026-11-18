import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { tagOutputSchema } from '../../output-schemas';

export const getTagAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_get_tag',
	outputSchema: tagOutputSchema,
	displayName: 'Get Tag',
	description: 'Gets a tag by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Returns one Clockify tag by ID: name and archived state.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		tagId: clockifyAiProps.tagId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.getTag({
			auth,
			workspaceId: propsValue.workspaceId,
			tagId: propsValue.tagId,
		});
	},
});
