import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { agentUtils, MistralAgent } from '../common/agents';
import { agentOutputSchema } from '../output-schemas';

export const createAgent = createAction({
	auth: mistralAuth,
	name: 'create_agent',
	classification: 'WRITE',
	displayName: 'Create Agent',
	description: 'Create a Mistral agent with a model, instructions and tools (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a reusable Mistral agent (Beta) from a model, a name, optional instructions, built-in tools (web search, code interpreter, image generation) and document libraries, and returns its agent id. Run the agent with Start Conversation using that id; change it later with Update Agent. Not idempotent: each call creates another agent, even with the same name.',
		idempotent: false,
	},
	outputSchema: agentOutputSchema,
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		model: Property.ShortText({
			displayName: 'Model',
			description: 'Chat model id the agent runs on, e.g. mistral-medium-latest.',
			required: true,
			defaultValue: 'mistral-medium-latest',
		}),
		instructions: Property.LongText({
			displayName: 'Instructions',
			description: 'The system prompt the agent follows in every conversation.',
			required: false,
		}),
		description: Property.ShortText({ displayName: 'Description', required: false }),
		...agentUtils.toolsProps(),
		temperature: Property.Number({ displayName: 'Temperature', required: false }),
	},
	async run(context) {
		const { name, model, instructions, description, built_in_tools, library_ids, temperature } = context.propsValue;
		const agent = await mistralApi.call<MistralAgent>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/agents',
			body: mistralApi.compact({
				name,
				model,
				instructions,
				description,
				tools: agentUtils.buildTools({
					builtInTools: mistralApi.toStringArray(built_in_tools),
					libraryIds: mistralApi.toStringArray(library_ids),
				}),
				completion_args: temperature === undefined || temperature === null ? undefined : { temperature },
			}),
		});
		return agentUtils.formatAgent(agent);
	},
});
