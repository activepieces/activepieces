import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { agentUtils, MistralAgent } from '../common/agents';
import { listAgentsOutputSchema } from '../output-schemas';

export const listAgents = createAction({
	auth: mistralAuth,
	name: 'list_agents',
	classification: 'SEARCH',
	displayName: 'List Agents',
	description: 'List the Mistral agents in your organization (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists Mistral agents (Beta) with their ids, names, models, instructions and tools, optionally filtered by a name or id search, one page at a time. Use it to find the agent id for Start Conversation, Get Agent, Update Agent or Delete Agent. Pass the returned next page token to get the next page. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: listAgentsOutputSchema,
	props: {
		search: Property.ShortText({
			displayName: 'Search',
			description: 'Only return agents whose name or id contains this text.',
			required: false,
		}),
		page_size: Property.Number({ displayName: 'Page Size', required: false, defaultValue: 20 }),
		page_token: Property.ShortText({
			displayName: 'Page Token',
			description: 'The next page token from a previous call.',
			required: false,
		}),
	},
	async run(context) {
		const { search, page_size, page_token } = context.propsValue;
		const response = await mistralApi.call<{ data: MistralAgent[]; next_page_token?: string | null }>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: '/agents/pages',
			queryParams: { search, page_size, page_token },
		});
		const agents = response.data.map(agentUtils.formatAgent);
		return {
			agents,
			count: agents.length,
			next_page_token: response.next_page_token ?? null,
		};
	},
});
