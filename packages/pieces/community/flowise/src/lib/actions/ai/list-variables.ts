import { createAction } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseListVariablesOutputSchema } from '../../output-schemas';

export const listVariablesAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_list_variables',
	outputSchema: flowiseListVariablesOutputSchema,
	displayName: 'List Variables',
	description: 'Lists the variables in the workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the workspace variables (used in flows as `$vars.<name>`) with their ids, names, values and types.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const variables = await flowiseApi.listVariables({ auth: context.auth });
		return { variables, count: variables.length };
	},
});
