import { History, Home, Logs } from 'lucide-react';
import { Link } from 'react-router-dom';

import { FlowActionsMenu } from './flow-actions-menu';

import {
  LeftSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { FlowStateToolbar } from '@/app/builder/flow-state-toolbar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/ui/user-avatar';

export const BuilderNavBar = () => {
  const [flowVersion, setLeftSidebar] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.setLeftSidebar,
  ]);

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
        <FlowActionsMenu></FlowActionsMenu>
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

        <FlowStateToolbar></FlowStateToolbar>
        <UserAvatar></UserAvatar>
      </div>
    </div>
  );
};
