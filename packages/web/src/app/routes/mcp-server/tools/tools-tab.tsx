import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { toast } from 'sonner';

import { McpFlows } from '@/app/components/project-settings/mcp-server/mcp-flows';
import { McpTools } from '@/app/components/project-settings/mcp-server/mcp-tools';
import { mcpHooks } from '@/app/components/project-settings/mcp-server/utils/mcp-hooks';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Skeleton } from '@/components/ui/skeleton';

import { PageBand } from '../page-band';
import {
  isProjectAccessError,
  ProjectAccessDeniedAlert,
} from '../project-access';
import { ProjectPicker } from '../project-picker';

const SKELETON_ROW_COUNT = 5;

export function ToolsTab({ projectId, onSelectProject }: ToolsTabProps) {
  const {
    data: mcpServer,
    isLoading,
    isError,
    error,
    refetch,
  } = mcpHooks.useMcpServer(projectId ?? '');
  const { mutate: updateMcpServer, isPending } = mcpHooks.useUpdateMcpServer(
    projectId ?? '',
  );

  const updateDisabledTools = (disabledTools: string[]) =>
    updateMcpServer(
      { disabledTools },
      {
        onError: (mutationError) =>
          toast.error(
            isProjectAccessError(mutationError)
              ? t('You are not allowed to change the tools of this project.')
              : t('The tools could not be saved. Try again.'),
          ),
      },
    );

  return (
    <PageBand className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-bold leading-7 tracking-tight">
          {t('Every tool a connected client can call in this project.')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            'Switch a tool off and every client loses it, in this project only.',
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ProjectPicker projectId={projectId} onSelect={onSelectProject} />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ToolsUnavailableAlert error={error} onRetry={refetch} />
      ) : isNil(mcpServer) ? null : (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold">{t('Internal Tools')}</h3>
              <p className="text-sm text-muted-foreground">
                {t(
                  'Control which built-in Activepieces tools are available to agents via this MCP server.',
                )}
              </p>
            </div>
            <McpTools
              key={projectId}
              disabledTools={mcpServer.disabledTools}
              isPending={isPending}
              onUpdateDisabledTools={updateDisabledTools}
            />
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold">{t('Your Flows')}</h3>
              <p className="text-sm text-muted-foreground">
                {t(
                  'Flows with the MCP Trigger are exposed as tools on this server.',
                )}
              </p>
            </div>
            <McpFlows mcpServer={mcpServer} />
          </section>
        </div>
      )}
    </PageBand>
  );
}

function ToolsUnavailableAlert({ error, onRetry }: ToolsUnavailableAlertProps) {
  if (isProjectAccessError(error)) {
    return <ProjectAccessDeniedAlert />;
  }

  return <DataFetchErrorState entity={t('the tools')} onRetry={onRetry} />;
}

type ToolsUnavailableAlertProps = {
  error: Error | null;
  onRetry: () => void;
};

type ToolsTabProps = {
  projectId: string | null;
  onSelectProject: (projectId: string) => void;
};
