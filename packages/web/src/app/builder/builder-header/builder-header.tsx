import { Permission } from '@activepieces/core-utils';
import {
  FlowOperationType,
  FlowVersionState,
  UncategorizedFolderId,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { EllipsisVertical, HistoryIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { RightSideBarType } from '@/app/builder/types';
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { flowHooks } from '@/features/flows';
import { foldersHooks } from '@/features/folders';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { NEW_FLOW_QUERY_PARAM } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import FlowActionMenu from '../../components/flow-actions-menu';
import { flowCanvasConsts } from '../flow-canvas/utils/consts';

import { BuilderFlowStatusSection } from './flow-status';

export const BuilderHeader = () => {
  const [queryParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const hasPermissionToReadRuns = useAuthorization().checkAccess(
    Permission.READ_FLOW,
  );
  const [
    flow,
    flowVersion,
    moveToFolderClientSide,
    applyOperation,
    setRightSidebar,
  ] = useBuilderStateContext((state) => [
    state.flow,
    state.flowVersion,
    state.moveToFolderClientSide,
    state.applyOperation,
    state.setRightSidebar,
  ]);

  const { embedState } = useEmbedding();
  const { project } = projectCollectionUtils.useCurrentProject();
  // When rendered inside the Stage, lift the flow title up into the Stage
  // header (matching the chat panel's title) instead of showing it here.
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

  const flowNameControl = (
    <>
      <EditableText
        className="hover:cursor-text"
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
          <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
        </Button>
      </FlowActionMenu>
    </>
  );

  const titleContent = (
    <div className="flex items-center gap-2 px-4">
      <Breadcrumb>
        <BreadcrumbList>
          {!embedState.disableNavigationInBuilder && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={goToFlowsPage}
                  className="cursor-pointer text-sm"
                >
                  {getProjectName(project)}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          {!embedState.hideFlowNameInBuilder && (
            <BreadcrumbItem>
              <BreadcrumbPage>
                <div
                  className={cn('flex items-center gap-1 text-sm', {
                    'max-w-[500px]': !isEditingFlowName,
                  })}
                >
                  {flowNameControl}
                </div>
              </BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );

  // Title rendered into the Stage header to mirror the chat panel's title.
  const stageTitleContent = (
    <div className="flex min-w-0 items-center gap-1 text-sm font-semibold">
      {flowNameControl}
    </div>
  );
  const stageTitle = useStageHeaderTitle(stageTitleContent);

  const controls = (
    <>
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
    </>
  );

  const rightContent = (
    <div className="flex items-center justify-center gap-4">{controls}</div>
  );

  // Inside the Stage, the right-side controls are lifted into the Stage header
  // (alongside the title) so the builder needs no header row of its own.
  const stageActions = useStageHeaderActions(
    stageSlot ? (
      <div className="flex items-center gap-2">{controls}</div>
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
    <div
      style={{
        height: `${flowCanvasConsts.BUILDER_HEADER_HEIGHT}px`,
      }}
    >
      <PageHeader
        title={titleContent}
        rightContent={rightContent}
        leftContent={leftContent}
        className="select-none border-b"
      />
    </div>
  );
};
