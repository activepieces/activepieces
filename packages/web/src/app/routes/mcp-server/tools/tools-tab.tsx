import { ApFlagId, isNil, SuggestionType } from '@activepieces/shared';
import { t } from 'i18next';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { mcpHooks } from '@/app/components/project-settings/mcp-server/utils/mcp-hooks';
import { getToolCategories } from '@/app/components/project-settings/mcp-server/utils/mcp-tools-metadata';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { SearchInput } from '@/components/custom/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';

import { McpToolGroup } from '../mcp-nav';
import { PageBand } from '../page-band';
import { PiecesPanel } from '../pieces/pieces-panel';
import { piecesUtils } from '../pieces/pieces-utils';
import {
  isProjectAccessError,
  ProjectAccessDeniedAlert,
} from '../project-access';
import { ProjectPicker } from '../project-picker';

import { BuiltInPanel } from './built-in-panel';

const RUN_ACTION_TOOL_NAME = 'ap_run_action';
const SKELETON_ROW_COUNT = 5;

export function ToolsTab({
  projectId,
  group,
  onSelectProject,
  onSelectGroup,
}: ToolsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
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
  const { data: toolSearchEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.TOOL_SEARCH_ENABLED,
  );
  const { pieces } = piecesHooks.usePieces({
    projectId: projectId ?? undefined,
    suggestionType: SuggestionType.ACTION,
    enabled: !isNil(projectId),
  });

  const builtInCount = useMemo(
    () =>
      getToolCategories({
        toolSearchEnabled: toolSearchEnabled ?? false,
      }).reduce((total, category) => total + category.tools.length, 0),
    [toolSearchEnabled],
  );
  const pieceCount = useMemo(
    () => (isNil(pieces) ? null : piecesUtils.countReachable({ pieces })),
    [pieces],
  );

  const selectGroup = (value: string) => {
    setSearchQuery('');
    onSelectGroup(value);
  };

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
          {t('Everything a connected client can call in this project.')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            'Built-in tools are switched on and off here. Pieces are controlled in piece sets.',
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ProjectPicker projectId={projectId} onSelect={onSelectProject} />
        <Tabs value={group} onValueChange={selectGroup}>
          <TabsList>
            <TabsTrigger value="built-in">
              {t('Built-in')}
              <GroupCount count={builtInCount} />
            </TabsTrigger>
            <TabsTrigger value="pieces">
              {t('Pieces')}
              <GroupCount count={pieceCount} />
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {group === 'pieces' && (
          <div className="w-full max-w-[360px]">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('Search pieces and actions...')}
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ToolsUnavailableAlert error={error} onRetry={refetch} />
      ) : isNil(mcpServer) ? null : group === 'pieces' ? (
        <PiecesPanel
          projectId={projectId}
          searchQuery={searchQuery}
          isRunActionDisabled={
            mcpServer.disabledTools?.includes(RUN_ACTION_TOOL_NAME) ?? false
          }
          onShowBuiltIn={() => selectGroup('built-in')}
        />
      ) : (
        <BuiltInPanel
          mcpServer={mcpServer}
          projectId={projectId}
          isPending={isPending}
          onUpdateDisabledTools={updateDisabledTools}
        />
      )}
    </PageBand>
  );
}

function GroupCount({ count }: { count: number | null }) {
  if (isNil(count)) {
    return null;
  }
  return <span className="ml-1.5 text-xs text-muted-foreground">{count}</span>;
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
  group: McpToolGroup;
  onSelectProject: (projectId: string) => void;
  onSelectGroup: (group: string) => void;
};
