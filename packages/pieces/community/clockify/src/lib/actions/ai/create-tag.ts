import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { tagOutputSchema } from '../../output-schemas';

export const createTagAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_create_tag',
	outputSchema: tagOutputSchema,
	displayName: 'Create Tag',
	description: 'Creates a tag in a workspace.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a tag in a Clockify workspace and returns it with its ID. Not idempotent: tag names must be unique, so a repeat fails; use List Tags with Exact Name Match to check first.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Tag name, unique in the workspace.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.createTag({
			auth,
			workspaceId: propsValue.workspaceId,
			name: propsValue.name,
		});
	},
});
