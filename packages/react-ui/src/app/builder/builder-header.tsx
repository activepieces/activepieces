import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Bug, ChevronDown, History, Home, Logs } from 'lucide-react';
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
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId, FlowVersionState, supportUrl } from '@activepieces/shared';

import FlowActionMenu from '../components/flow-actions-menu';

import { BuilderPublishButton } from './builder-publish-button';
import { ReportBugsButton } from '@/components/ui/report-bugs-button';

export const BuilderHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showSupport = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
    useQueryClient(),
  );
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
          <ReportBugsButton variant="ghost"></ReportBugsButton>
          {showSupport && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() =>
                    window.open(supportUrl, '_blank', 'noopener noreferrer')
                  }
                >
                  <QuestionMarkCircledIcon className="w-6 h-6"></QuestionMarkCircledIcon>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('Support')}</TooltipContent>
            </Tooltip>
          )}
          {!isInRunsPage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => setLeftSidebar(LeftSideBarType.VERSIONS)}
                >
                  <History className="w-6 h-6" />
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
                <Logs className="w-6 h-6" />
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
