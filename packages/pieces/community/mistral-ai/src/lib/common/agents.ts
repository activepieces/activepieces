import { Property } from '@activepieces/pieces-framework';

function buildTools({ builtInTools, libraryIds }: { builtInTools: string[]; libraryIds: string[] }): AgentTool[] | undefined {
	const tools: AgentTool[] = [
		...builtInTools.map((type) => ({ type })),
		...(libraryIds.length > 0 ? [{ type: 'document_library', library_ids: libraryIds }] : []),
	];
	return tools.length > 0 ? tools : undefined;
}

function formatAgent(agent: MistralAgent) {
	return {
		id: agent.id,
		name: agent.name,
		description: agent.description ?? null,
		model: agent.model,
		instructions: agent.instructions ?? null,
		tools: (agent.tools ?? []).map((tool) => tool.type),
		library_ids: (agent.tools ?? []).flatMap((tool) => tool.library_ids ?? []),
		temperature: agent.completion_args?.temperature ?? null,
		version: agent.version,
		versions: agent.versions ?? [],
		source: agent.source ?? null,
		created_at: agent.created_at,
		updated_at: agent.updated_at,
	};
}

function toolsProps() {
	return {
		built_in_tools: Property.StaticMultiSelectDropdown({
			displayName: 'Built-in Tools',
			description: 'Mistral-hosted tools the agent may use.',
			required: false,
			options: {
				options: [
					{ label: 'Web Search', value: 'web_search' },
					{ label: 'Web Search (Premium)', value: 'web_search_premium' },
					{ label: 'Code Interpreter', value: 'code_interpreter' },
					{ label: 'Image Generation', value: 'image_generation' },
				],
			},
		}),
		library_ids: Property.Array({
			displayName: 'Document Library IDs',
			description: 'Library UUIDs (from List Libraries) the agent can search for answers.',
			required: false,
		}),
	};
}

export const agentUtils = { buildTools, formatAgent, toolsProps };

export type AgentTool = { type: string; library_ids?: string[] };

export type MistralAgent = {
	id: string;
	name: string;
	description?: string | null;
	model: string;
	instructions?: string | null;
	tools?: AgentTool[];
	completion_args?: { temperature?: number | null };
	version: number;
	versions?: number[];
	source?: string;
	created_at: string;
	updated_at: string;
};
