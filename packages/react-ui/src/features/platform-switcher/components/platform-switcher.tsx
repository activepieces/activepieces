'use client';

import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Building2 } from 'lucide-react';
import * as React from 'react';

import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { platformApi } from '@/lib/platforms-api';
import { cn } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

import { ScrollArea } from '../../../components/ui/scroll-area';

function PlatformSwitcher() {
  const { data: user } = userHooks.useCurrentUser();
  const { data: platforms } = useQuery({
    queryKey: ['platforms', user?.id],
    queryFn: () => platformApi.listPlatforms(),
    enabled: !isNil(user),
  });
  const [open, setOpen] = React.useState(false);
  const { embedState } = useEmbedding();
  const { platform: currentPlatform } = platformHooks.useCurrentPlatform();
  const filterPlatforms = React.useCallback(
    (platformId: string, search: string) => {
      //Radix UI lowercases the value string (platformId)
      const platform = platforms?.find(
        (platforms) => platforms.id.toLowerCase() === platformId,
      );
      if (!platform) {
        return 0;
      }
      return platform.name.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
    },
    [platforms],
  );
  const switchPlatformMutation = useMutation({
    mutationFn: async (platformId: string) => {
      await authenticationSession.switchToPlatform(platformId);
    },
  });
  const sortedPlatforms = (platforms ?? []).sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
  if (!platforms || platforms.length <= 1) {
    return null;
  }
  if (embedState.isEmbedded) {
    return null;
  }
  return (
    <div className="flex items-center gap-1 mr-1">
      {' '}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            size={'sm'}
            aria-expanded={open}
            aria-label="Select a platform"
            className="gap-2 max-w-[200px] justify-between"
          >
            <Building2 className="size-4 shrink-0"></Building2>
            <span className="truncate">{currentPlatform.name}</span>
            <CaretSortIcon className="ml-auto size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="max-w-[200px] p-0">
          <Command filter={filterPlatforms}>
            <CommandList>
              <CommandInput placeholder="Search platform..." />
              <CommandEmpty>{t('No platforms found')}</CommandEmpty>
              <CommandGroup key="platforms" heading="Platforms">
                <ScrollArea viewPortClassName="max-h-[200px]">
                  {sortedPlatforms &&
                    sortedPlatforms.map((platform) => (
                      <CommandItem
                        key={platform.id}
                        onSelect={() => {
                          switchPlatformMutation.mutate(platform.id);
                          setOpen(false);
                        }}
                        value={platform.id}
                        className="text-sm break-all"
                      >
                        {platform.name}
                        <CheckIcon
                          className={cn(
                            'ml-auto h-4 w-4 shrink-0',
                            currentPlatform.id === platform.id
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                      </CommandItem>
                    ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="text-xl text-muted-foreground/50 font-bold">/</div>
    </div>
  );
}

export { PlatformSwitcher };
