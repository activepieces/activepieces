import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseAssistantOutputSchema } from '../../output-schemas';

export const updateAssistantAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_update_assistant',
	outputSchema: flowiseAssistantOutputSchema,
	displayName: 'Update Assistant',
	description: 'Updates an assistant.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates an assistant by ID. `details` replaces the whole settings object, so pass every setting to keep (read them with Get Assistant first). OPENAI and AZURE assistants need both `details` and the Credential ID on every update.',
		idempotent: true,
	},
	props: {
		assistantId: Property.ShortText({
			displayName: 'Assistant ID',
			description: 'ID of the assistant, from List Assistants.',
			required: true,
		}),
		details: Property.Json({
			displayName: 'Details',
			description:
				'Full assistant settings object; replaces the current one. Must include `name` for CUSTOM.',
			required: false,
		}),
		credential: Property.ShortText({
			displayName: 'Credential ID',
			description: 'For OPENAI and AZURE: ID of the Flowise credential with the OpenAI API key.',
			required: false,
		}),
		iconSrc: Property.ShortText({
			displayName: 'Icon URL',
			description: 'URL of the assistant icon.',
			required: false,
		}),
	},
	async run(context) {
		const { assistantId, details, credential, iconSrc } = context.propsValue;
		return await flowiseApi.updateAssistant({
			auth: context.auth,
			assistantId,
			details,
			credential,
			iconSrc,
		});
	},
});
