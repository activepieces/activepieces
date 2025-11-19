import { t } from 'i18next';
import { ControllerRenderProps } from 'react-hook-form';

import { McpToolsSection } from '@/features/mcp/components/mcp-config/mcp-tools-section';
import { McpTool } from '@activepieces/shared';

type AgentToolsSettingsProps = {
  agentToolsField: ControllerRenderProps;
  disabled: boolean;
};

export const AgentTools = ({
  agentToolsField,
  disabled,
}: AgentToolsSettingsProps) => {
  const tools = Array.isArray(agentToolsField.value)
    ? (agentToolsField.value as McpTool[])
    : [];

  return (
    <McpToolsSection
      disabled={disabled}
      tools={tools}
      isLoading={false}
      onToolsUpdate={agentToolsField.onChange}
      emptyState={
        <p className="text-sm text-muted-foreground">{t('No tools set')}</p>
      }
    />
  );
};
