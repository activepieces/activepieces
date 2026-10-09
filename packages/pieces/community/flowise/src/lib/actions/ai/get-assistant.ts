import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseAssistantOutputSchema } from '../../output-schemas';

export const getAssistantAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_get_assistant',
	outputSchema: flowiseAssistantOutputSchema,
	displayName: 'Get Assistant',
	description: 'Gets one assistant by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one assistant by ID. Its `details` field is a JSON string with the name, model and instructions.',
		idempotent: true,
	},
	props: {
		assistantId: Property.ShortText({
			displayName: 'Assistant ID',
			description: 'ID of the assistant, from List Assistants.',
			required: true,
		}),
	},
	async run(context) {
		return await flowiseApi.getAssistant({
			auth: context.auth,
			assistantId: context.propsValue.assistantId,
		});
	},
});
