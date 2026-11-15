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
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { RightSideBarType } from '@/app/builder/types';
import { ActiveUsersWidget } from '@/components/custom/active-users-widget';
import EditableText from '@/components/custom/editable-text';
import { HomeButton } from '@/components/custom/home-button';
import { PageHeader } from '@/components/custom/page-header';
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
import { FlowCreatedByBadge } from '@/features/flows/components/flow-created-by-badge';
import { foldersHooks } from '@/features/folders';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';
import { NEW_FLOW_QUERY_PARAM } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import FlowActionMenu from '../../components/flow-actions-menu';
import { flowCanvasConsts } from '../flow-canvas/utils/consts';

import { FlowConnectionsPopover } from './flow-connections-popover';
import { BuilderFlowStatusSection } from './flow-status';

export const BuilderHeader = ({ isFlowLocked }: { isFlowLocked: boolean }) => {
  const [queryParams] = useSearchParams();
  const navigate = useNavigate();
  const isRunsPage = useLocation().pathname.includes('/runs');
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
    moveToFolderClientSide,
    applyOperation,
    setRightSidebar,
    savePendingEdits,
    readonly,
  ] = useBuilderStateContext((state) => [
    state.flow,
    state.flowVersion,
    state.moveToFolderClientSide,
    state.applyOperation,
    state.setRightSidebar,
    state.savePendingEdits,
    state.readonly,
  ]);

  const { embedState } = useEmbedding();
  const { project } = projectCollectionUtils.useCurrentProject();

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

  const titleContent = (
    <div className="flex min-w-0 items-center gap-2 px-4">
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap">
          {!embedState.disableNavigationInBuilder && (
            <>
              <BreadcrumbItem className="min-w-0 @max-xl:hidden">
                <BreadcrumbLink
                  onClick={goToFlowsPage}
                  className="cursor-pointer truncate text-sm"
                >
                  {getProjectName(project)}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="@max-xl:hidden" />
            </>
          )}
          {!embedState.hideFlowNameInBuilder && (
            <BreadcrumbItem className="min-w-16">
              <BreadcrumbPage className="min-w-0">
                <div
                  className={cn(
                    'flex min-w-0 items-center gap-1 rounded-md px-1 text-sm',
                    {
                      'max-w-[500px]': !isEditingFlowName || readonly,
                    },
                  )}
                >
                  <EditableText
                    className="hover:cursor-text"
                    value={flowVersion.displayName}
                    readonly={readonly}
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
                    isEditing={isEditingFlowName && !readonly}
                    setIsEditing={setIsEditingFlowName}
                    tooltipContent=""
                  />
                  <FlowActionMenu
                    onVersionsListClick={() => {
                      setRightSidebar(RightSideBarType.VERSIONS);
                    }}
                    insideBuilder={true}
                    savePendingEdits={savePendingEdits}
                    flow={flow}
                    flowVersion={flowVersion}
                    readonly={readonly}
                    onDelete={goToFlowsPage}
                    onRename={() => {
                      setIsEditingFlowName(true);
                    }}
                    onMoveTo={(folderId) => moveToFolderClientSide(folderId)}
                    onDuplicate={() => {}}
                  >
                    <Button variant="ghost" size="icon-xs">
                      <ChevronDown className="h-4 w-4 text-gray-11" />
                    </Button>
                  </FlowActionMenu>
                </div>
              </BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );

  const rightContent = (
    <div className="flex shrink-0 items-center justify-center gap-4 @max-2xl:gap-2">
      {isLatestVersion &&
        !isRunsPage &&
        !embedState.hideConnectionsInBuilder && (
          <FlowConnectionsPopover isFlowLocked={isFlowLocked} />
        )}
      {showSupport && (
        <Button
          variant="ghost"
          aria-label={t('Support')}
          onClick={() => openNewWindow(supportUrl)}
        >
          <CircleHelp className="w-4 h-4"></CircleHelp>
          <span className="@max-2xl:hidden">{t('Support')}</span>
        </Button>
      )}
      {!embedState.hideActiveUsers && (
        <ActiveUsersWidget resourceId={flow.id} />
      )}
      {hasPermissionToReadRuns && (
        <Button
          variant="ghost"
          aria-label={t('Runs')}
          onClick={() => setRightSidebar(RightSideBarType.RUNS)}
        >
          <HistoryIcon className="w-4 h-4" />
          <span className="@max-2xl:hidden">{t('Runs')}</span>
        </Button>
      )}

      <BuilderFlowStatusSection></BuilderFlowStatusSection>
      <FlowCreatedByBadge createdBy={flow.createdBy} />
    </div>
  );

  const leftContent = embedState.isEmbedded ? <HomeButton /> : null;

  return (
    <div
      className="@container"
      style={{
        height: `$${flowCanvasConsts.BUILDER_HEADER_HEIGHT}px`,
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
