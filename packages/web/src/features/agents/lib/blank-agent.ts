import {
  AgentIcon,
  ColorName,
  CreateAgentRequest,
  DEFAULT_AGENT_MAX_STEPS,
} from '@activepieces/shared';
import { t } from 'i18next';

function blankAgentRequest({
  projectId,
  folderId,
}: {
  projectId: string;
  folderId?: string | null;
}): CreateAgentRequest {
  return {
    projectId,
    displayName: t('New agent'),
    description: null,
    icon: AgentIcon.BOT,
    color: ColorName.PURPLE,
    folderId: folderId ?? null,
    draft: {
      instructions: '',
      maxSteps: DEFAULT_AGENT_MAX_STEPS,
      tools: [],
      structuredOutput: [],
    },
  };
}

export const blankAgentUtils = { request: blankAgentRequest };
