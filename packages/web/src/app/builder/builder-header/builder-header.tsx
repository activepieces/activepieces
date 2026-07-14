import { Permission } from '@activepieces/core-utils';
import {
  ApFlagId,
  FlowOperationType,
  FlowVersionState,
  supportUrl,
  UncategorizedFolderId,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronDown, CircleHelp, HistoryIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { RightSideBarType } from '@/app/builder/types';
import { DetailPageBreadcrumb } from '@/app/components/project-layout/detail-page-breadcrumb';
import { useStageOptional } from '@/app/components/workspace-shell/stage-context';
import { ActiveUsersWidget } from '@/components/custom/active-users-widget';
import EditableText from '@/components/custom/editable-text';
import { HomeButton } from '@/components/custom/home-button';
import { PageHeader } from '@/components/custom/page-header';
import {
  stageResourceKey,
  useReportStageResourceTitle,
  useStageHeaderActions,
  useStageHeaderSlot,
  useStageHeaderTitle,
} from '@/components/custom/stage-header-slot';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import { flowHooks } from '@/features/flows';
import { FlowCreatedByBadge } from '@/features/flows/components/flow-created-by-badge';
import { foldersHooks } from '@/features/folders';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';
import { NEW_FLOW_QUERY_PARAM } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import FlowActionMenu from '../../components/flow-actions-menu';

import { BuilderFlowStatusSection } from './flow-status';

export const BuilderHeader = () => {
  const [queryParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const openNewWindow = useNewWindow();
  const { data: showSupport } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );

  const hasPermissionToReadRuns = useAuthorization().checkAccess(
    Permission.READ_FLOW,
  );
  const [
    flow,
    flowVersion,
    run,
    moveToFolderClientSide,
    applyOperation,
    setRightSidebar,
  ] = useBuilderStateContext((state) => [
    state.flow,
    state.flowVersion,
    state.run,
    state.moveToFolderClientSide,
    state.applyOperation,
    state.setRightSidebar,
  ]);

  const { embedState } = useEmbedding();
  // When rendered inside the Stage, lift the flow title up into the Stage
  // header (next to its breadcrumb) instead of showing a header row here.
  const stageSlot = useStageHeaderSlot()?.slot ?? null;
  const stageCurrent = useStageOptional()?.current;
  useReportStageResourceTitle(
    stageCurrent
      ? stageResourceKey(
          stageCurrent.type,
          'id' in stageCurrent ? stageCurrent.id : undefined,
        )
      : null,
    flowVersion.displayName,
  );

  const { data: folderData } = foldersHooks.useFolder(
    flow.folderId ?? UncategorizedFolderId,
  );

  const isLatestVersion =
    flowVersion.state === FlowVersionState.DRAFT ||
    flowVersion.id === flow.publishedVersionId;
  const [isEditingFlowName, setIsEditingFlowName] = useState(false);
  useEffect(() => {
    setIsEditingFlowName(queryParams.get(NEW_FLOW_QUERY_PARAM) === 'true');
  }, []);

  const goToFlowsPage = () => {
    navigate({
      pathname: authenticationSession.appendProjectRoutePrefix('/automations'),
      search: createSearchParams({
        folderId: folderData?.id ?? UncategorizedFolderId,
      }).toString(),
    });
  };

  const flowTitle = !embedState.hideFlowNameInBuilder && (
    <div
      className={cn('flex items-center gap-px text-sm', {
        'max-w-[500px]': !isEditingFlowName,
      })}
    >
      <EditableText
        className="rounded-md px-1.5 py-1 font-medium hover:cursor-text hover:bg-gray-300/30 hover:text-accent-foreground dark:hover:bg-gray-300/10"
        editingClassName="bg-background ring-1 ring-input"
        value={flowVersion.displayName}
        readonly={!isLatestVersion}
        onValueChange={(value) => {
          applyOperation(
            {
              type: FlowOperationType.CHANGE_NAME,
              request: {
                displayName: value,
              },
            },
            () => {
              flowHooks.invalidateFlowsQuery(queryClient);
            },
          );
        }}
        isEditing={isEditingFlowName}
        setIsEditing={setIsEditingFlowName}
        tooltipContent=""
      />
      <FlowActionMenu
        onVersionsListClick={() => {
          setRightSidebar(RightSideBarType.VERSIONS);
        }}
        insideBuilder={true}
        flow={flow}
        flowVersion={flowVersion}
        readonly={!isLatestVersion}
        onDelete={goToFlowsPage}
        onRename={() => {
          setIsEditingFlowName(true);
        }}
        onMoveTo={(folderId) => moveToFolderClientSide(folderId)}
        onDuplicate={() => {}}
      >
        <Button
          variant="ghost"
          className="size-6 flex items-center justify-center"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </FlowActionMenu>
    </div>
  );

  const titleContent = embedState.disableNavigationInBuilder ? (
    <div className="flex items-center gap-2 px-1.5">{flowTitle}</div>
  ) : (
    <div className="min-w-0 pr-1.5">
      <DetailPageBreadcrumb section={run ? 'runs' : 'automations'}>
        {flowTitle}
      </DetailPageBreadcrumb>
    </div>
  );

  const controls = (
    <>
      {showSupport && (
        <Button
          variant="ghost"
          className="gap-2 px-2"
          onClick={() => openNewWindow(supportUrl)}
        >
          <CircleHelp className="w-4 h-4"></CircleHelp>
          {t('Support')}
        </Button>
      )}
      {!embedState.hideActiveUsers && (
        <ActiveUsersWidget resourceId={flow.id} />
      )}
      {hasPermissionToReadRuns && (
        <Button
          variant="ghost"
          onClick={() => setRightSidebar(RightSideBarType.RUNS)}
          className="gap-2 px-2"
        >
          <HistoryIcon className="w-4 h-4" />
          {t('Runs')}
        </Button>
      )}

      <BuilderFlowStatusSection></BuilderFlowStatusSection>
      <FlowCreatedByBadge createdBy={flow.createdBy} />
    </>
  );

  const rightContent = (
    <div className="flex items-center justify-center gap-4">{controls}</div>
  );

  // Title rendered into the Stage header, right after its breadcrumb (which
  // already shows project / Automations for the open flow).
  const stageTitle = useStageHeaderTitle(flowTitle || null);

  // Inside the Stage, the right-side controls are lifted into the Stage header
  // (alongside the title) so the builder needs no header row of its own.
  const stageActions = useStageHeaderActions(
    stageSlot ? (
      <div className="flex items-center gap-4">{controls}</div>
    ) : null,
  );

  const leftContent = embedState.isEmbedded ? <HomeButton /> : null;

  if (stageSlot) {
    return (
      <>
        {stageTitle}
        {stageActions}
      </>
    );
  }

  return (
    <PageHeader
      title={titleContent}
      rightContent={rightContent}
      leftContent={leftContent}
      showSidebarToggle={!embedState.isEmbedded}
      className="select-none h-12 border-b px-2 py-0"
    />
  );
};
