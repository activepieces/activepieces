import { ControllerRenderProps } from 'react-hook-form';

import { AgentTools } from '@/features/agents/agent-tools';
import { AgentStructuredOutput } from '@/features/agents/structured-output';
import {
  AGENT_ACTION_NAME,
  AGENT_PIECE_NAME,
  AgentPieceProps,
} from '@activepieces/shared';

function input(pieceName: string, actionName: string, propertyName: string) {
  return `${pieceName}:${actionName}:${propertyName}`
}

type GetCustomPropertiesRegistryParams = {
  field: ControllerRenderProps<Record<string, any>, string>;
  disabled: boolean;
};

export const getCustomPropertiesRegistry = ({
  disabled,
  field,
}: GetCustomPropertiesRegistryParams): Record<string, JSX.Element> => {
  return {
    [input(AGENT_PIECE_NAME, AGENT_ACTION_NAME, AgentPieceProps.AGENT_TOOLS)]: (
      <AgentTools disabled={disabled} agentToolsField={field} />
    ),
    [input(AGENT_PIECE_NAME, AGENT_ACTION_NAME, AgentPieceProps.STRUCTURED_OUTPUT)]: (
      <AgentStructuredOutput
        disabled={disabled}
        structuredOutputField={field}
      />
    )
  };
};
