import { t } from 'i18next';

import { McpTools } from '@/app/components/project-settings/mcp-server/mcp-tools';

export function BuiltInPanel({
  disabledTools,
  platformDisabledTools,
  projectId,
  isPending,
  onUpdateDisabledTools,
}: BuiltInPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {t(
          'Control which built-in Activepieces tools are available to agents via this MCP server.',
        )}
      </p>
      <McpTools
        key={projectId}
        disabledTools={disabledTools}
        platformDisabledTools={platformDisabledTools}
        projectId={projectId ?? undefined}
        isPending={isPending}
        onUpdateDisabledTools={onUpdateDisabledTools}
      />
    </div>
  );
}

type BuiltInPanelProps = {
  disabledTools: string[] | null;
  platformDisabledTools: string[];
  projectId: string | null;
  isPending: boolean;
  onUpdateDisabledTools: (tools: string[]) => void;
};
