import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { ChevronDown, History, Home, Logs } from 'lucide-react';
import { useMemo } from 'react';
import {
  createSearchParams,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  LeftSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { useEmbedding, useNewWindow } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
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
import {
  ApFlagId,
  FlowVersionState,
  Permission,
  supportUrl,
} from '@activepieces/shared';

import FlowActionMenu from '../components/flow-actions-menu';

import { BuilderPublishButton } from './builder-publish-button';

export const BuilderHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const openNewWindow = useNewWindow();
  const { data: showSupport } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );
  const branding = flagsHooks.useWebsiteBranding();
  const isInRunsPage = useMemo(
    () => location.pathname.startsWith('/runs'),
    [location.pathname],
  );
  const hasPermissionToReadRuns = useAuthorization().checkAccess(
    Permission.READ_FLOW,
  );
  const [
    flow,
    flowVersion,
    setLeftSidebar,
    renameFlowClientSide,
    moveToFolderClientSide,
  ] = useBuilderStateContext((state) => [
    state.flow,
    state.flowVersion,
    state.setLeftSidebar,
    state.renameFlowClientSide,
    state.moveToFolderClientSide,
  ]);

  const { embedState } = useEmbedding();

  const { data: folderData } = foldersHooks.useFolder(flow.folderId ?? 'NULL');

  const isLatestVersion =
    flowVersion.state === FlowVersionState.DRAFT ||
    flowVersion.id === flow.publishedVersionId;

  const folderName = folderData?.displayName ?? t('Uncategorized');

  return (
    <div className="bg-background ">
      <div className="relative items-left flex h-[70px] w-full p-4 bg-muted/50 border-b">
        <div className="flex h-full items-center justify-center gap-2">
          {!embedState.disableNavigationInBuilder && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/flows">
                  <Button variant="ghost" size={'icon'}>
                    <Home className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('Home')}</TooltipContent>
            </Tooltip>
          )}
          <span>
            {!embedState.hideFolders && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      onClick={() =>
                        navigate({
                          pathname: '/flows',
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
              <strong>{flowVersion.displayName}</strong>
            )}
          </span>
          <FlowActionMenu
            insideBuilder={true}
            flow={flow}
            flowVersion={flowVersion}
            readonly={!isLatestVersion}
            onDelete={() => {
              navigate('/flows');
            }}
            onRename={(newName) => renameFlowClientSide(newName)}
            onMoveTo={(folderId) => moveToFolderClientSide(folderId)}
            onDuplicate={() => {}}
          >
            <ChevronDown className="h-8 w-8" />
          </FlowActionMenu>
        </div>
        {!embedState.hideLogoInBuilder && (
          <div className="absolute absolute w-full h-full left-0 top-0 flex items-center justify-center p-4 pointer-events-none">
            <img
              className="h-8 object-contain"
              src={branding.logos.fullLogoUrl}
              alt={branding.websiteName}
            ></img>
          </div>
        )}

        <div className="grow "></div>
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

          <BuilderPublishButton></BuilderPublishButton>
          <UserAvatar></UserAvatar>
        </div>
      </div>
    </div>
  );
};
