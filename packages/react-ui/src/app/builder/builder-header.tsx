import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { ChevronDown, History, Logs } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  createSearchParams,
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  LeftSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { useEmbedding, useNewWindow } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import EditableText from '@/components/ui/editable-text';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/ui/user-avatar';
import { foldersHooks } from '@/features/folders/lib/folders-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { determineDefaultRoute, NEW_FLOW_QUERY_PARAM } from '@/lib/utils';
import {
  ApFlagId,
  FlowOperationType,
  FlowVersionState,
  Permission,
  supportUrl,
} from '@activepieces/shared';

import FlowActionMenu from '../components/flow-actions-menu';

import { BuilderFlowStatusSection } from './builder-flow-status-section';

export const BuilderHeader = () => {
  const [queryParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const openNewWindow = useNewWindow();
  const { data: showSupport } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );
  const branding = flagsHooks.useWebsiteBranding();
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
  ] = useBuilderStateContext((state) => [
    state.flow,
    state.flowVersion,
    state.setLeftSidebar,
    state.moveToFolderClientSide,
    state.applyOperation,
  ]);

  const { embedState } = useEmbedding();

  const { data: folderData } = foldersHooks.useFolder(flow.folderId ?? 'NULL');

  const isLatestVersion =
    flowVersion.state === FlowVersionState.DRAFT ||
    flowVersion.id === flow.publishedVersionId;
  const folderName = folderData?.displayName ?? t('Uncategorized');
  const defaultRoute = determineDefaultRoute(useAuthorization().checkAccess);
  const [isEditingFlowName, setIsEditingFlowName] = useState(false);
  useEffect(() => {
    setIsEditingFlowName(queryParams.get(NEW_FLOW_QUERY_PARAM) === 'true');
  }, []);
  return (
    <div className="bg-background select-none">
      <div className="relative items-center flex h-[55px] w-full p-4 bg-muted/30">
        <div className="flex items-center gap-2">
          {!embedState.hideLogoInBuilder &&
            !embedState.disableNavigationInBuilder && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to={defaultRoute}>
                    <Button variant="ghost" size={'icon'} className="size-10">
                      <img
                        className="h-7 w-7 object-contain"
                        src={branding.logos.logoIconUrl}
                        alt={branding.websiteName}
                      />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t('Go to Dashboard')}
                </TooltipContent>
              </Tooltip>
            )}
          <div className="flex gap-2 items-center">
            {!embedState.hideFolders && (
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
                      <span>
                        {t('Go to folder')} {folderName}
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {' / '}
              </>
            )}
            {!embedState.hideFlowNameInBuilder && (
              <EditableText
                className="font-semibold"
                value={flowVersion.displayName}
                readonly={!isLatestVersion}
                onValueChange={(value) =>
                  applyOperation({
                    type: FlowOperationType.CHANGE_NAME,
                    request: {
                      displayName: value,
                    },
                  })
                }
                isEditing={isEditingFlowName}
                setIsEditing={setIsEditingFlowName}
              />
            )}
          </div>
          <FlowActionMenu
            insideBuilder={true}
            flow={flow}
            flowVersion={flowVersion}
            readonly={!isLatestVersion}
            onDelete={() => {
              navigate('/flows');
            }}
            onRename={() => {
              setIsEditingFlowName(true);
            }}
            onMoveTo={(folderId) => moveToFolderClientSide(folderId)}
            onDuplicate={() => {}}
          >
            <ChevronDown className="h-8 w-8" />
          </FlowActionMenu>
        </div>

        <div className="grow"></div>
        <div className="flex items-center justify-center gap-4">
          {showSupport && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 px-2"
                  onClick={() => openNewWindow(supportUrl)}
                >
                  <QuestionMarkCircledIcon className="w-4 h-4"></QuestionMarkCircledIcon>
                  {t('Support')}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('Support')}</TooltipContent>
            </Tooltip>
          )}
          {hasPermissionToReadRuns && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => setLeftSidebar(LeftSideBarType.RUNS)}
                  className="gap-2 px-2"
                >
                  <Logs className="w-4 h-4" />
                  {t('Runs')}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('Run Logs')}</TooltipContent>
            </Tooltip>
          )}

          {!isInRunsPage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 px-2"
                  onClick={() => setLeftSidebar(LeftSideBarType.VERSIONS)}
                >
                  <History className="w-4 h-4" />
                  {t('Versions')}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t('Versions History')}
              </TooltipContent>
            </Tooltip>
          )}

          <BuilderFlowStatusSection></BuilderFlowStatusSection>
          <UserAvatar></UserAvatar>
        </div>
      </div>
    </div>
  );
};
