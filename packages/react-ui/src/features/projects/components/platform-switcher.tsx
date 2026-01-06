import { CheckIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import * as React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { projectHooks } from '@/hooks/project-collection';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { ScrollArea } from '../../../components/ui/scroll-area';
import { platformHooks } from '../../../hooks/platform-hooks';

export function PlatformSwitcher({ children }: { children: React.ReactNode }) {
  const { data: allProjects } = projectHooks.useProjectsForPlatforms();
  const { platform: currentPlatform } = platformHooks.useCurrentPlatform();

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

  const dropdownContent = (
    <DropdownMenuContent
      className="w-56 rounded-lg"
      align="start"
      side="right"
      sideOffset={4}
    >
      <div className="px-2 py-1.5">
        <p className="text-xs text-muted-foreground">{t('Platforms')}</p>
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
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      {dropdownContent}
    </DropdownMenu>
  );
}
