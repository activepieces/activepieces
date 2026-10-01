import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Plus } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { projectHooks } from '@/features/projects/stores/project-collection';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { ScrollArea } from '../../../components/ui/scroll-area';
import { platformHooks } from '../../../hooks/platform-hooks';

import { CreatePlatformDialog } from './create-platform-dialog';

export function PlatformSwitcher({ children }: { children: React.ReactNode }) {
  const { data: allProjects } = projectHooks.useProjectsForPlatforms();
  const { platform: currentPlatform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const isCloud = edition === ApEdition.CLOUD;

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
      className="z-60 w-56"
      align="start"
      side="right"
      sideOffset={4}
    >
      <DropdownMenuLabel>{t('Platforms')}</DropdownMenuLabel>
      <ScrollArea viewPortClassName="max-h-[400px]">
        {platforms.map((platform) => (
          <DropdownMenuItem
            key={platform.id}
            onClick={() => handlePlatformSwitch(platform.id)}
            className="cursor-pointer break-all"
          >
            {platform.name}
            <Check
              className={cn(
                'ml-auto',
                currentPlatform?.id === platform.id
                  ? 'opacity-100'
                  : 'opacity-0',
              )}
            />
          </DropdownMenuItem>
        ))}
      </ScrollArea>
      {isCloud && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setCreateDialogOpen(true)}
            className="cursor-pointer"
          >
            <Plus />
            {t('Create Platform')}
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="w-full">
          {children}
        </DropdownMenuTrigger>
        {dropdownContent}
      </DropdownMenu>
      {isCloud && (
        <CreatePlatformDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}
    </>
  );
}
