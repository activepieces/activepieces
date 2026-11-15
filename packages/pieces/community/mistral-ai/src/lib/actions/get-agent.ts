import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { agentUtils, MistralAgent } from '../common/agents';
import { agentOutputSchema } from '../output-schemas';

export const getAgent = createAction({
	auth: mistralAuth,
	name: 'get_agent',
	classification: 'READ',
	displayName: 'Get Agent',
	description: 'Get the configuration of a Mistral agent (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns one Mistral agent’s configuration (Beta) by agent id: model, instructions, tools, libraries and version numbers, optionally at a specific version. Get agent ids from List Agents or Create Agent. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: agentOutputSchema,
	props: {
		agent_id: Property.ShortText({
			displayName: 'Agent ID',
			description: 'The agent id (usually starts with ag_), from List Agents.',
			required: true,
		}),
		agent_version: Property.Number({
			displayName: 'Version',
			description: 'Return this version instead of the current one.',
			required: false,
		}),
	},
	async run(context) {
		const { agent_id, agent_version } = context.propsValue;
		const agent = await mistralApi.call<MistralAgent>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/agents/${encodeURIComponent(agent_id)}`,
			queryParams: { agent_version },
		});
		return agentUtils.formatAgent(agent);
	},
});
