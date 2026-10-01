import { ApFlagId, isNil, SuggestionType } from '@activepieces/shared';
import { t } from 'i18next';
import { useMemo, useState } from 'react';

import { McpToolTierList } from '@/app/components/project-settings/mcp-server/tool-tiers/mcp-tool-tier-list';
import { mcpHooks } from '@/app/components/project-settings/mcp-server/utils/mcp-hooks';
import { getToolCategories } from '@/app/components/project-settings/mcp-server/utils/mcp-tools-metadata';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { PageSection, Toolbar } from '@/components/custom/page';
import { SearchInput } from '@/components/custom/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';

import { McpToolSegment } from '../mcp-nav';
import { PiecesPanel } from '../pieces/pieces-panel';
import { piecesUtils } from '../pieces/pieces-utils';
import {
  isProjectAccessError,
  ProjectAccessDeniedAlert,
} from '../project-access';
import { ProjectPicker } from '../project-picker';

import { reachableProjectUtils } from './project-selection';

const RUN_ACTION_TOOL_NAME = 'ap_run_action';
const SKELETON_ROW_COUNT = 5;

export function ToolsTab({
  projectId,
  reachableProjectIds,
  segment,
  onSelectProject,
  onSelectSegment,
}: ToolsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const selectedProjectId = reachableProjectUtils.resolveSelected({
    projectId,
    reachableProjectIds,
  });
  const {
    data: mcpServer,
    isLoading,
    isError,
    error,
    refetch,
  } = mcpHooks.useMcpServer(selectedProjectId ?? '');
  const { data: toolSearchEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.TOOL_SEARCH_ENABLED,
  );
  const { pieces } = piecesHooks.usePieces({
    projectId: selectedProjectId ?? undefined,
    suggestionType: SuggestionType.ACTION,
    enabled: !isNil(selectedProjectId),
  });

  const builtInCount = useMemo(
    () =>
      getToolCategories({
        toolSearchEnabled: toolSearchEnabled ?? false,
      }).reduce((total, category) => total + category.tools.length, 0),
    [toolSearchEnabled],
  );
  const pieceCount = useMemo(
    () => (isNil(pieces) ? null : piecesUtils.countReachablePieces({ pieces })),
    [pieces],
  );

  const selectSegment = (value: string) => {
    setSearchQuery('');
    onSelectSegment(value);
  };

  return (
    <PageSection
      title={t('Everything a connected client can call in this project.')}
      description={t(
        'Built-in tools are switched on and off here. Pieces are controlled in piece sets.',
      )}
    >
      <Toolbar>
        <ProjectPicker
          projectId={selectedProjectId}
          allowedProjectIds={reachableProjectIds}
          onSelect={onSelectProject}
        />
        <Tabs value={segment} onValueChange={selectSegment}>
          <TabsList>
            <TabsTrigger value="built-in">
              {t('Built-in')}
              <SegmentCount count={builtInCount} />
            </TabsTrigger>
            <TabsTrigger value="pieces">
              {t('Pieces')}
              <SegmentCount count={pieceCount} />
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {segment === 'pieces' && (
          <div className="w-full max-w-[360px]">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('Search pieces and actions...')}
            />
          </div>
        )}
      </Toolbar>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ToolsUnavailableAlert error={error} onRetry={refetch} />
      ) : isNil(mcpServer) ? null : segment === 'pieces' ? (
        <PiecesPanel
          projectId={selectedProjectId}
          searchQuery={searchQuery}
          isRunActionDisabled={(mcpServer.disabledTools ?? []).includes(
            RUN_ACTION_TOOL_NAME,
          )}
          isRunActionDisabledByPlatform={mcpServer.platformDisabledTools.includes(
            RUN_ACTION_TOOL_NAME,
          )}
          onShowBuiltIn={() => selectSegment('built-in')}
        />
      ) : (
        <ProjectToolTiers
          key={selectedProjectId}
          projectId={selectedProjectId ?? ''}
          disabledTools={mcpServer.disabledTools}
          platformDisabledTools={mcpServer.platformDisabledTools}
        />
      )}
    </PageSection>
  );
}

function ProjectToolTiers({
  projectId,
  disabledTools,
  platformDisabledTools,
}: ProjectToolTiersProps) {
  const { mutate: updateMcpServer } = mcpHooks.useUpdateMcpServer(projectId);
  return (
    <McpToolTierList
      disabledTools={disabledTools}
      platformDisabledTools={platformDisabledTools}
      scope="project"
      projectId={projectId}
      onUpdateDisabledTools={({ tools, onSettled }) =>
        updateMcpServer({ disabledTools: tools }, { onSettled })
      }
    />
  );
}

function SegmentCount({ count }: { count: number | null }) {
  if (isNil(count)) {
    return null;
  }
  return <span className="text-xs text-gray-11 tabular-nums">{count}</span>;
}

function ToolsUnavailableAlert({ error, onRetry }: ToolsUnavailableAlertProps) {
  if (isProjectAccessError(error)) {
    return <ProjectAccessDeniedAlert />;
  }

  return <DataFetchErrorState entity={t('tools')} onRetry={onRetry} />;
}

type ToolsUnavailableAlertProps = {
  error: Error | null;
  onRetry: () => void;
};

type ProjectToolTiersProps = {
  projectId: string;
  disabledTools: string[] | null;
  platformDisabledTools: string[];
};

type ToolsTabProps = {
  projectId: string | null;
  reachableProjectIds: string[] | null;
  segment: McpToolSegment;
  onSelectProject: (projectId: string) => void;
  onSelectSegment: (segment: string) => void;
};
