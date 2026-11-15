import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseDeleteResultOutputSchema } from '../../output-schemas';

export const deleteAssistantAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_delete_assistant',
	outputSchema: flowiseDeleteResultOutputSchema,
	displayName: 'Delete Assistant',
	description: 'Permanently deletes an assistant.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes an assistant from Flowise. With Delete on OpenAI Too, an OPENAI or AZURE assistant is also deleted on OpenAI. This cannot be undone.',
		idempotent: false,
	},
	props: {
		assistantId: Property.ShortText({
			displayName: 'Assistant ID',
			description: 'ID of the assistant, from List Assistants.',
			required: true,
		}),
		isDeleteBoth: Property.Checkbox({
			displayName: 'Delete on OpenAI Too',
			description: 'For OPENAI and AZURE assistants: also delete the assistant on OpenAI.',
			required: false,
		}),
	},
	async run(context) {
		const { assistantId, isDeleteBoth } = context.propsValue;
		return await flowiseApi.deleteAssistant({ auth: context.auth, assistantId, isDeleteBoth });
	},
});
