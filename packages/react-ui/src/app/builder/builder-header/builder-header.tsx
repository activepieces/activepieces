import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronDown, Logs } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  LeftSideBarType,
  RightSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { ApSidebarToggle } from '@/components/custom/ap-sidebar-toggle';
import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import EditableText from '@/components/ui/editable-text';
import { HomeButton } from '@/components/ui/home-button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowHooks } from '@/features/flows/lib/flow-hooks';
import { foldersHooks } from '@/features/folders/lib/folders-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';
import { NEW_FLOW_QUERY_PARAM } from '@/lib/utils';
import {
  ApFlagId,
  FlowOperationType,
  FlowVersionState,
  Permission,
  supportUrl,
  UncategorizedFolderId,
} from '@activepieces/shared';

import FlowActionMenu from '../../components/flow-actions-menu';
import { BuilderFlowStatusSection } from '../builder-flow-status-section';

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
    setLeftSidebar,
    moveToFolderClientSide,
    applyOperation,
    setRightSidebar,
  ] = useBuilderStateContext((state) => [
    state.flow,
    state.flowVersion,
    state.setLeftSidebar,
    state.moveToFolderClientSide,
    state.applyOperation,
    state.setRightSidebar,
  ]);

  const { embedState } = useEmbedding();

  const { data: folderData } = foldersHooks.useFolder(
    flow.folderId ?? UncategorizedFolderId,
  );

  const isLatestVersion =
    flowVersion.state === FlowVersionState.DRAFT ||
    flowVersion.id === flow.publishedVersionId;
  const folderName = folderData?.displayName ?? t('Uncategorized');
  const [isEditingFlowName, setIsEditingFlowName] = useState(false);
  useEffect(() => {
    setIsEditingFlowName(queryParams.get(NEW_FLOW_QUERY_PARAM) === 'true');
  }, []);

  const goToFolder = () => {
    navigate({
      pathname: authenticationSession.appendProjectRoutePrefix('/flows'),
      search: createSearchParams({
        folderId: folderData?.id ?? UncategorizedFolderId,
      }).toString(),
    });
  };

  return (
    <div className="border-b select-none">
      <div className="relative items-center flex  w-full px-4 py-3">
        <div className="flex items-center gap-2">
          {!embedState.isEmbedded && <ApSidebarToggle />}
          {embedState.isEmbedded && <HomeButton />}
          <div className="flex gap-2 items-center text-lg">
            {!embedState.hideFolders &&
              !embedState.disableNavigationInBuilder && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger onClick={goToFolder}>
                        {folderName}
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>{t('Go to...')}</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {' / '}
                </>
              )}
            {!embedState.hideFlowNameInBuilder && (
              <EditableText
                className="font-semibold hover:cursor-text"
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
                tooltipContent={isLatestVersion ? t('Edit') : ''}
              />
            )}
          </div>
          {!embedState.hideFlowNameInBuilder && (
            <FlowActionMenu
              onVersionsListClick={() => {
                setRightSidebar(RightSideBarType.VERSIONS);
              }}
              insideBuilder={true}
              flow={flow}
              flowVersion={flowVersion}
              readonly={!isLatestVersion}
              onDelete={goToFolder}
              onRename={() => {
                setIsEditingFlowName(true);
              }}
              onMoveTo={(folderId) => moveToFolderClientSide(folderId)}
              onDuplicate={() => {}}
            >
              <Button variant="ghost" size="icon">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </FlowActionMenu>
          )}
        </div>

        <div className="grow"></div>
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
              onClick={() => setLeftSidebar(LeftSideBarType.RUNS)}
              className="gap-2 px-2"
            >
              <Logs className="w-4 h-4" />
              {t('Runs')}
            </Button>
          )}

          <BuilderFlowStatusSection></BuilderFlowStatusSection>
        </div>
      </div>
    </div>
  );
};
