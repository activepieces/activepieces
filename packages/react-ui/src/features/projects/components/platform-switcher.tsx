import { CheckIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { ChevronsUpDown, Menu } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { ScrollArea } from '../../../components/ui/scroll-area';
import { platformHooks } from '../../../hooks/platform-hooks';
import { projectHooks } from '../../../hooks/project-hooks';

export function PlatformSwitcher() {
  const { data: allProjects } = projectHooks.useProjectsForPlatforms();
  const { platform: currentPlatform } = platformHooks.useCurrentPlatform();
  const { state } = useSidebar();

  const platforms = React.useMemo(() => {
    if (!allProjects) return [];
    return allProjects.map((platform) => ({
      name: platform.platformName,
      id: platform.projects[0]?.platformId,
    }));
  }, [allProjects]);

  const handlePlatformSwitch = async (platformId: string) => {
    await authenticationSession.switchToPlatform(platformId);
  };

  return (
    <DropdownMenu>
      {state === 'collapsed' ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="size-5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" align="center">
              {t('Switch Account')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="px-2 h-9 gap-x-3">
            <h1 className="truncate font-semibold">{currentPlatform?.name}</h1>
            <ChevronsUpDown className="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
      )}

      <DropdownMenuContent
        className="w-56 rounded-lg"
        align="start"
        side="right"
        sideOffset={4}
      >
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground">{t('Accounts')}</p>
        </div>
        <ScrollArea viewPortClassName="max-h-[400px]">
          {platforms.map((platform) => (
            <DropdownMenuItem
              key={platform.id}
              onClick={() => handlePlatformSwitch(platform.id)}
              className="text-sm p-2 break-all cursor-pointer"
            >
              {platform.name}
              <CheckIcon
                className={cn(
                  'ml-auto h-4 w-4 shrink-0',
                  currentPlatform?.id === platform.id
                    ? 'opacity-100'
                    : 'opacity-0',
                )}
              />
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
