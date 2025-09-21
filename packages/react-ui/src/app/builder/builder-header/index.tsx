import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronDown, History, ListChecks } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  createSearchParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  LeftSideBarType,
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
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { flowsHooks } from '@/features/flows/lib/flows-hooks';
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
} from '@activepieces/shared';

import FlowActionMenu from '../../components/flow-actions-menu';
import { BuilderFlowStatusSection } from './builder-flow-status-section';
import { PublishButton } from './builder-flow-status-section/publish-button';
import { EditFlowOrViewDraftButton } from './builder-flow-status-section/view-draft-or-edit-flow-button';
import { TestFlowButton } from './builder-flow-status-section/test-flow-button';
import { IncompleteSettingsButton } from './builder-flow-status-section/test-flow-button/incomplete-settings-button';

export const BuilderHeader = () => {
  const [queryParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const openNewWindow = useNewWindow();
  const { data: showSupport } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );
  const isInRunsPage = useMemo(
    () => location.pathname.includes('/runs'),
    [location.pathname],
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
    readonly,
    selectStepByName,
  ] = useBuilderStateContext((state) => [
    state.flow,
    state.flowVersion,
    state.setLeftSidebar,
    state.moveToFolderClientSide,
    state.applyOperation,
    state.readonly,
    state.selectStepByName,
  ]);

  const { embedState } = useEmbedding();

  const { data: folderData } = foldersHooks.useFolder(flow.folderId ?? 'NULL');

  const isLatestVersion =
    flowVersion.state === FlowVersionState.DRAFT ||
    flowVersion.id === flow.publishedVersionId;
  const folderName = folderData?.displayName ?? t('Uncategorized');
  const [isEditingFlowName, setIsEditingFlowName] = useState(false);
  useEffect(() => {
    setIsEditingFlowName(queryParams.get(NEW_FLOW_QUERY_PARAM) === 'true');
  }, []);

  return (
    <div className="border-b select-none">
      <div className="relative items-center flex h-[55px] w-full p-4">
        <div className="flex items-center gap-2">
          {!embedState.isEmbedded && <ApSidebarToggle />}
          {embedState.isEmbedded && <HomeButton />}
          <div className="flex gap-2 items-center">
            {!embedState.hideFolders &&
              !embedState.disableNavigationInBuilder && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        onClick={() =>
                          navigate({
                            pathname:
                              authenticationSession.appendProjectRoutePrefix(
                                '/flows',
                              ),
                            search: createSearchParams({
                              folderId: folderData?.id ?? 'NULL',
                            }).toString(),
                          })
                        }
                      >
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
                      flowsHooks.invalidateFlowsQuery(queryClient);
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
              insideBuilder={true}
              flow={flow}
              flowVersion={flowVersion}
              readonly={!isLatestVersion}
              onDelete={() => {
                flowsHooks.invalidateFlowsQuery(queryClient);
              }}
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
          <BuilderFlowStatusSection/>
          <div className="flex items-center justify-center gap-5"> 
            {showSupport && (
              <Tooltip>
                <TooltipTrigger asChild> 
                   <QuestionMarkCircledIcon className="w-5 h-5 cursor-pointer hover:text-primary text-slate-600" onClick={() => openNewWindow(supportUrl)}/>
                </TooltipTrigger>
                <TooltipContent>
                  {t('Community Support')}
                </TooltipContent>
              </Tooltip>
            )}
            {hasPermissionToReadRuns && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ListChecks className="w-5 h-5 cursor-pointer hover:text-primary text-slate-600" onClick={() => setLeftSidebar(LeftSideBarType.RUNS)} />
                </TooltipTrigger>
                <TooltipContent>
                  {t('Runs')}
                </TooltipContent>
              </Tooltip>
            )}

            {!isInRunsPage && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <History className="w-5 h-5 cursor-pointer hover:text-primary text-slate-600" onClick={() => setLeftSidebar(LeftSideBarType.VERSIONS)} />
                </TooltipTrigger>
                <TooltipContent>
                  {t('Versions')}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <EditFlowOrViewDraftButton />
          {!readonly && (
            <IncompleteSettingsButton
              flowVersion={flowVersion}
              selectStepByName={selectStepByName}
            ></IncompleteSettingsButton>
          )}
          <TestFlowButton />
          <PublishButton />

        </div>
      </div>
    </div>
  );
};
