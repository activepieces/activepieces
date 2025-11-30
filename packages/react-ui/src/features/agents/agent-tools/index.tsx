import { t } from 'i18next';
import { ControllerRenderProps } from 'react-hook-form';

import { AgentTool, Tool } from '@activepieces/shared';

type AgentToolsSettingsProps = {
  agentToolsField: ControllerRenderProps;
  disabled: boolean;
};

export const AgentTools = ({
  agentToolsField,
  disabled,
}: AgentToolsSettingsProps) => {
  const tools = Array.isArray(agentToolsField.value)
    ? (agentToolsField.value as Tool[])
    : [];

  return (<></>
  );
};
