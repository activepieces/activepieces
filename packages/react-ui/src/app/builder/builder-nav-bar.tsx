import { FlowVersionState } from '@activepieces/shared';
import { ChevronDown, History, Home, Logs } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { BuilderPublishButton } from './builder-publish-button';

import {
  LeftSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/ui/user-avatar';
import FlowActionMenu from '@/features/flows/components/flow-actions-menu';

export const BuilderNavBar = () => {
  const navigate = useNavigate();

  const [flow, flowVersion, setLeftSidebar, renameFlowClientSide] =
    useBuilderStateContext((state) => [
      state.flow,
      state.flowVersion,
      state.setLeftSidebar,
      state.renameFlowClientSide,
    ]);

  const isLatestVersion =
    flowVersion.state === FlowVersionState.DRAFT ||
    flowVersion.id === flow.publishedVersionId;

  return (
    <div className="items-left flex h-[70px] w-full p-4 bg-muted/50 border-b">
      <div className="flex h-full items-center justify-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/flows">
              <Button variant="ghost" size={'icon'} className="p-0">
                <Home />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">Home</TooltipContent>
        </Tooltip>
        <span>{flowVersion.displayName}</span>
        <FlowActionMenu
          flow={flow}
          flowVersion={flowVersion}
          readonly={!isLatestVersion}
          onDelete={() => {
            navigate('/flows');
          }}
          onRename={(newName) => renameFlowClientSide(newName)}
          onMoveTo={() => {}}
          onDuplicate={() => {}}
        >
          <ChevronDown className="h-4 w-4" />
        </FlowActionMenu>
      </div>
      <div className="grow"></div>
      <div className="flex items-center justify-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={() => setLeftSidebar(LeftSideBarType.VERSIONS)}
            >
              <History />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Version History</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={() => setLeftSidebar(LeftSideBarType.RUNS)}
            >
              <Logs />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Run Logs</TooltipContent>
        </Tooltip>

        <BuilderPublishButton></BuilderPublishButton>
        <UserAvatar></UserAvatar>
      </div>
    </div>
  );
};
