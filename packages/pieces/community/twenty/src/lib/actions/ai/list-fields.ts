import { createAction } from '@activepieces/pieces-framework';

import { twentyAuth } from '../../auth';
import { twentyAiProps } from '../../common/ai-props';
import { twentyApi } from '../../common/api';
import { twentyListFieldsOutputSchema } from '../../output-schemas';

export const listFieldsAction = createAction({
	auth: twentyAuth,
	name: 'twenty_list_fields',
	outputSchema: twentyListFieldsOutputSchema,
	displayName: 'List Fields',
	description: 'Lists field definitions across all objects in the workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists field definitions across every object in the workspace, one page at a time. It cannot filter by object, so prefer Get Object to see one object's fields. Needs the API key's role to have the Data Model settings permission.",
		idempotent: true,
	},
	props: {
		limit: twentyAiProps.limit({
			required: false,
			description: 'Maximum number of fields to return.',
		}),
		startingAfter: twentyAiProps.startingAfter({ required: false }),
	},
	async run(context) {
		const { limit, startingAfter } = context.propsValue;
		return await twentyApi.listFields({ auth: context.auth, limit, startingAfter });
	},
});
