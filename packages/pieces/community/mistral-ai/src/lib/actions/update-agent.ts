import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { AgentTool, agentUtils, MistralAgent } from '../common/agents';
import { MistralAuthValue } from '../common/request';
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
			'Updates a Mistral agent (Beta) by agent id; only the fields you pass change and the rest are kept. Built-in tools and document libraries are replaced independently: passing one keeps the other as it was. Tools cannot be cleared here. Each update creates a new agent version. Get the id from List Agents. Idempotent: sending the same values again leaves the same configuration.',
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
			tools: await resolveTools({
				auth: context.auth,
				agentId: agent_id,
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

async function resolveTools({ auth, agentId, builtInTools, libraryIds }: ResolveToolsParams): Promise<AgentTool[] | undefined> {
	if (builtInTools.length === 0 && libraryIds.length === 0) {
		return undefined;
	}
	const updated = agentUtils.buildTools({ builtInTools, libraryIds }) ?? [];
	if (builtInTools.length > 0 && libraryIds.length > 0) {
		return updated;
	}
	const current = await mistralApi.call<MistralAgent>({
		auth,
		method: HttpMethod.GET,
		path: `/agents/${encodeURIComponent(agentId)}`,
	});
	const keepLibraries = libraryIds.length === 0;
	const kept = (current.tools ?? []).filter((tool) => (tool.type === 'document_library') === keepLibraries);
	return [...updated, ...kept];
}

type ResolveToolsParams = {
	auth: MistralAuthValue;
	agentId: string;
	builtInTools: string[];
	libraryIds: string[];
};
