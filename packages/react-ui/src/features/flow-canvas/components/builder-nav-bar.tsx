import { ChevronDown, History, Home, Logs } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LeftSideBarType, useBuilderStateContext } from '@/hooks/builder-hooks';

export const BuilderNavBar = () => {
  const { setLeftSidebar } = useBuilderStateContext((state) => state);

  return (
    <div className="items-left flex h-[70px] w-full  p-4 bg-accent">
      <div className="flex h-full  items-center justify-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/flows">
              <Button variant="ghost" className="p-0">
                <Home />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">Home</TooltipContent>
        </Tooltip>
        <span>Flow Untitled</span>
        <ChevronDown size={16}></ChevronDown>
      </div>
      <div className="grow"></div>
      <div className="flex items-center justify-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={() => setLeftSidebar(LeftSideBarType.VERSIONS)}
            >
              <History />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">History</TooltipContent>
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

        <Button>Publish</Button>
      </div>
    </div>
  );
};
