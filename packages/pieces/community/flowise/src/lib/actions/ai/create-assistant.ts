import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseAssistantOutputSchema } from '../../output-schemas';

export const createAssistantAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_create_assistant',
	outputSchema: flowiseAssistantOutputSchema,
	displayName: 'Create Assistant',
	description: 'Creates a new assistant.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an assistant. CUSTOM assistants live only in Flowise and need just `details` with a `name`. OPENAI and AZURE assistants are also created on OpenAI and need the ID of a Flowise credential that holds the OpenAI API key. Each call creates another assistant.',
		idempotent: false,
	},
	props: {
		type: Property.StaticDropdown({
			displayName: 'Type',
			description:
				'CUSTOM keeps the assistant in Flowise; OPENAI and AZURE also create it on OpenAI.',
			required: true,
			defaultValue: 'CUSTOM',
			options: {
				disabled: false,
				options: [
					{ label: 'Custom', value: 'CUSTOM' },
					{ label: 'OpenAI', value: 'OPENAI' },
					{ label: 'Azure', value: 'AZURE' },
				],
			},
		}),
		details: Property.Json({
			displayName: 'Details',
			description:
				'Assistant settings as an object, e.g. `{"name":"Support bot","description":"...","model":"gpt-4o","instructions":"..."}`. `name` is required for CUSTOM.',
			required: true,
		}),
		credential: Property.ShortText({
			displayName: 'Credential ID',
			description:
				'For OPENAI and AZURE: ID of the Flowise credential with the OpenAI API key. Leave empty for CUSTOM.',
			required: false,
		}),
		iconSrc: Property.ShortText({
			displayName: 'Icon URL',
			description: 'URL of the assistant icon.',
			required: false,
		}),
	},
	async run(context) {
		const { type, details, credential, iconSrc } = context.propsValue;
		return await flowiseApi.createAssistant({
			auth: context.auth,
			type,
			details,
			credential,
			iconSrc,
		});
	},
});
