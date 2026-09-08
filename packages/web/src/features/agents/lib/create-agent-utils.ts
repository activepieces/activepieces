import {
  AgentDraftFields,
  CreateAgentRequest,
  DEFAULT_AGENT_MAX_STEPS,
  DraftAgentResponse,
} from '@activepieces/shared';

const buildCreateRequest = ({
  draft,
  projectId,
}: {
  draft: AgentDraftFields & Partial<DraftAgentResponse>;
  projectId: string;
}): CreateAgentRequest => ({
  projectId,
  displayName: draft.displayName,
  description: draft.description.length > 0 ? draft.description : null,
  icon: draft.icon,
  color: draft.color,
  draft: {
    instructions: draft.instructions,
    provider: draft.provider ?? null,
    modelName: draft.modelName ?? null,
    maxSteps: DEFAULT_AGENT_MAX_STEPS,
    tools: draft.tools ?? [],
    structuredOutput: [],
  },
});

export const createAgentUtils = { buildCreateRequest };
