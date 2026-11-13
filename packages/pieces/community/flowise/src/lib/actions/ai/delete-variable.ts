import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseDeleteResultOutputSchema } from '../../output-schemas';

export const deleteVariableAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_delete_variable',
	outputSchema: flowiseDeleteResultOutputSchema,
	displayName: 'Delete Variable',
	description: 'Permanently deletes a workspace variable.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a workspace variable by ID. Flows that read it get an empty value. This cannot be undone.',
		idempotent: false,
	},
	props: {
		variableId: Property.ShortText({
			displayName: 'Variable ID',
			description: 'ID of the variable, from List Variables.',
			required: true,
		}),
	},
	async run(context) {
		return await flowiseApi.deleteVariable({
			auth: context.auth,
			variableId: context.propsValue.variableId,
		});
	},
});
