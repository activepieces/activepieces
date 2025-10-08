import { ControllerRenderProps } from 'react-hook-form';

import { McpToolsSection } from '@/app/routes/mcp-servers/id/mcp-config/mcp-tools-section';
import { McpTool } from '@activepieces/shared';

type AgentToolsSettingsProps = {
  field: ControllerRenderProps;
};

export const AgentToolsSettings = ({ field }: AgentToolsSettingsProps) => {
  const tools = Array.isArray(field.value) ? (field.value as McpTool[]) : [];

  return (
    <McpToolsSection
      tools={tools}
      description="Louai is doing"
      isLoading={false}
      onToolsUpdate={field.onChange}
    />
  );
};
