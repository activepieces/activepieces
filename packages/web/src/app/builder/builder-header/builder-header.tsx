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
import { ActiveUsersWidget } from '@/components/custom/active-users-widget';
import EditableText from '@/components/custom/editable-text';
import { HomeButton } from '@/components/custom/home-button';
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
    <div className="flex min-w-0 items-center gap-2">
      <Breadcrumb>
        <BreadcrumbList>
          {!embedState.disableNavigationInBuilder && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={goToFlowsPage}
                  className="cursor-pointer font-normal"
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
                  className={cn('flex items-center gap-1', {
                    'max-w-[500px]': !isEditingFlowName,
                  })}
                >
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
                    <Button variant="ghost" size="icon-xs">
                      <ChevronDown className="text-gray-11" />
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

  if (embedState.hidePageHeader) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 flex h-12 w-full shrink-0 select-none items-center gap-2 border-b bg-gray-1 px-4">
      {embedState.isEmbedded && <HomeButton />}
      <div className="flex min-w-0 flex-1 items-center text-sm font-semibold">
        {titleContent}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {showSupport && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openNewWindow(supportUrl)}
          >
            <CircleHelp />
            {t('Support')}
          </Button>
        )}
        {!embedState.hideActiveUsers && (
          <ActiveUsersWidget resourceId={flow.id} />
        )}
        {hasPermissionToReadRuns && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRightSidebar(RightSideBarType.RUNS)}
          >
            <HistoryIcon />
            {t('Runs')}
          </Button>
        )}
        <BuilderFlowStatusSection />
        <FlowCreatedByBadge createdBy={flow.createdBy} />
      </div>
    </header>
  );
};
