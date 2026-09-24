import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { agentUtils, MistralAgent } from '../common/agents';
import { agentOutputSchema } from '../output-schemas';

export const updateAgent = createAction({
	auth: mistralAuth,
	name: 'update_agent',
	classification: 'WRITE',
	displayName: 'Update Agent',
	description: 'Change a Mistral agent’s name, model, instructions or tools (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates a Mistral agent (Beta) by agent id; only the fields you pass change and the rest are kept. Setting tools or libraries replaces the agent’s whole tool list. Each update creates a new agent version. Get the id from List Agents. Idempotent: sending the same values again leaves the same configuration.',
		idempotent: true,
	},
	outputSchema: agentOutputSchema,
	props: {
		agent_id: Property.ShortText({
			displayName: 'Agent ID',
			description: 'The agent id (usually starts with ag_), from List Agents.',
			required: true,
		}),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		model: Property.ShortText({ displayName: 'Model', required: false }),
		instructions: Property.LongText({ displayName: 'Instructions', required: false }),
		description: Property.ShortText({ displayName: 'Description', required: false }),
		...agentUtils.toolsProps(),
		temperature: Property.Number({ displayName: 'Temperature', required: false }),
	},
	async run(context) {
		const { agent_id, name, model, instructions, description, built_in_tools, library_ids, temperature } = context.propsValue;
		const body = mistralApi.compact({
			name,
			model,
			instructions,
			description,
			tools: agentUtils.buildTools({
				builtInTools: mistralApi.toStringArray(built_in_tools),
				libraryIds: mistralApi.toStringArray(library_ids),
			}),
			completion_args: temperature === undefined || temperature === null ? undefined : { temperature },
		});
		if (Object.keys(body).length === 0) {
			throw new Error('Provide at least one field to update.');
		}
		const agent = await mistralApi.call<MistralAgent>({
			auth: context.auth,
			method: HttpMethod.PATCH,
			path: `/agents/${encodeURIComponent(agent_id)}`,
			body,
		});
		return agentUtils.formatAgent(agent);
	},
});
