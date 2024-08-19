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
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/ui/user-avatar';
import { foldersHooks } from '@/features/folders/lib/folders-hooks';
import { FlowVersionState } from '@activepieces/shared';

import FlowActionMenu from '../components/flow-actions-menu';

import { BuilderPublishButton } from './builder-publish-button';

export const BuilderNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isInRunsPage = useMemo(
    () => location.pathname.startsWith('/runs'),
    [location.pathname],
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

  const { data: folderData } = foldersHooks.useFolder(flow.folderId ?? 'NULL');

  const isLatestVersion =
    flowVersion.state === FlowVersionState.DRAFT ||
    flowVersion.id === flow.publishedVersionId;

  const folderName = folderData?.displayName ?? t('Uncategorized');

  return (
    <div className="bg-background ">
      <div className=" items-left flex h-[70px] w-full p-4 bg-muted/50 border-b">
        <div className="flex h-full items-center justify-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/flows">
                <Button variant="ghost" size={'icon'} className="p-2.5">
                  <Home />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('Home')}</TooltipContent>
          </Tooltip>
          <span>
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
            <strong>{flowVersion.displayName}</strong>
          </span>
          <FlowActionMenu
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
        <div className="grow"></div>
        <div className="flex items-center justify-center gap-4">
          {!isInRunsPage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => setLeftSidebar(LeftSideBarType.VERSIONS)}
                >
                  <History />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t('Version History')}
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={() => setLeftSidebar(LeftSideBarType.RUNS)}
              >
                <Logs />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('Run Logs')}</TooltipContent>
          </Tooltip>

          <BuilderPublishButton></BuilderPublishButton>
          <UserAvatar></UserAvatar>
        </div>
      </div>
    </div>
  );
};
