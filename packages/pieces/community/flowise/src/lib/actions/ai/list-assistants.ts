import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseListAssistantsOutputSchema } from '../../output-schemas';

export const listAssistantsAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_list_assistants',
	outputSchema: flowiseListAssistantsOutputSchema,
	displayName: 'List Assistants',
	description: 'Lists the assistants in the workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the assistants in the workspace, optionally only one type. Each `details` field is a JSON string with the name, model and instructions. Returns the assistant ids that Get, Update and Delete Assistant take.',
		idempotent: true,
	},
	props: {
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'Only list assistants of this type.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Custom', value: 'CUSTOM' },
					{ label: 'OpenAI', value: 'OPENAI' },
					{ label: 'Azure', value: 'AZURE' },
				],
			},
		}),
	},
	async run(context) {
		const assistants = await flowiseApi.listAssistants({
			auth: context.auth,
			type: context.propsValue.type,
		});
		return { assistants, count: assistants.length };
	},
});
