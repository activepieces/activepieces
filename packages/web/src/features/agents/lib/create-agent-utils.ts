import {
  CreateAgentRequest,
  DEFAULT_AGENT_MAX_STEPS,
  DraftAgentResponse,
} from '@activepieces/shared';

const buildCreateRequest = ({
  draft,
  projectId,
}: {
  draft: DraftAgentResponse;
  projectId: string;
}): CreateAgentRequest => ({
  projectId,
  displayName: draft.displayName,
  description: draft.description.length > 0 ? draft.description : null,
  icon: draft.icon,
  color: draft.color,
  draft: {
    instructions: draft.instructions,
    provider: null,
    modelName: null,
    maxSteps: DEFAULT_AGENT_MAX_STEPS,
    tools: [],
    structuredOutput: [],
  },
});

export const createAgentUtils = { buildCreateRequest };
