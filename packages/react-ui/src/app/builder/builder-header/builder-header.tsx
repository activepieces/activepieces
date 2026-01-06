import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronDown, HistoryIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { PageHeader } from '@/components/custom/page-header';
import { useEmbedding } from '@/components/embed-provider';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import EditableText from '@/components/ui/editable-text';
import { HomeButton } from '@/components/ui/home-button';
import { flowHooks } from '@/features/flows/lib/flow-hooks';
import { foldersHooks } from '@/features/folders/lib/folders-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import {
  getProjectName,
  projectCollectionUtils,
} from '@/hooks/project-collection';
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';
import { RightSideBarType } from '@/lib/types';
import { cn, NEW_FLOW_QUERY_PARAM } from '@/lib/utils';
import {
  ApFlagId,
  FlowOperationType,
  FlowVersionState,
  Permission,
  supportUrl,
  UncategorizedFolderId,
} from '@activepieces/shared';

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
      pathname: authenticationSession.appendProjectRoutePrefix('/flows'),
      search: createSearchParams({
        folderId: folderData?.id ?? UncategorizedFolderId,
      }).toString(),
    });
  };

  const titleContent = (
    <Breadcrumb>
      <BreadcrumbList>
        {!embedState.disableNavigationInBuilder && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={goToFlowsPage}
                className="cursor-pointer text-base"
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
                className={cn('flex items-center gap-1 text-base', {
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
                  <Button
                    variant="ghost"
                    className="size-6 flex items-center justify-center"
                  >
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </FlowActionMenu>
              </div>
            </BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );

  const rightContent = (
    <div className="flex items-center justify-center gap-4">
      {showSupport && (
        <Button
          variant="ghost"
          className="gap-2 px-2"
          onClick={() => openNewWindow(supportUrl)}
        >
          <QuestionMarkCircledIcon className="w-4 h-4"></QuestionMarkCircledIcon>
          {t('Support')}
        </Button>
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
    </div>
  );

  const leftContent = embedState.isEmbedded ? <HomeButton /> : null;

  return (
    <PageHeader
      title={titleContent}
      rightContent={rightContent}
      leftContent={leftContent}
      showBorder={true}
      className="select-none"
      hideSidebarTrigger={embedState.isEmbedded}
    />
  );
};
