import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceDeleteSpaceOutputSchema } from '../../output-schemas';

export const deleteSpaceAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_delete_space',
	outputSchema: confluenceDeleteSpaceOutputSchema,
	displayName: 'Delete Space',
	description: 'Starts deleting a space and everything in it.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Starts permanently deleting a Confluence space, identified by its key, with all its content; this cannot be undone. Returns a long task ID; poll it with Get Long Task Status. Needs space admin. Not idempotent.',
		idempotent: false,
	},
	props: {
		spaceKey: confluenceAiProps.spaceKey({ required: true }),
	},
	async run(context) {
		return await confluenceApi.deleteSpace({
			auth: context.auth,
			spaceKey: context.propsValue.spaceKey,
		});
	},
});
