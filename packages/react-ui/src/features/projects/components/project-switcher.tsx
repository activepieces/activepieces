'use client';

import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import * as React from 'react';
import { useLocation } from 'react-router-dom';

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
import { cn } from '@/lib/utils';

import { ScrollArea } from '../../../components/ui/scroll-area';
import { projectHooks } from '../../../hooks/project-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApEdition, ApFlagId } from '@activepieces/shared';

function ProjectSwitcher() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { data: allProjects } = projectHooks.useProjectsForPlatforms(edition || ApEdition.COMMUNITY);
  const [open, setOpen] = React.useState(false);
  const { data: currentProject, setCurrentProject } = projectHooks.useCurrentProject();

  const filterProjects = React.useCallback(
    (value: string, search: string) => {
      if (!allProjects) {
        return 0;
      }
      const project = allProjects
        ?.flatMap((p) => p.projects)
        .find((p) => p.id === value);

      if (!project) return 0;

      return project.displayName.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
    },
    [allProjects],
  );

  if (edition === ApEdition.COMMUNITY) {
    return (
      <div className="gap-2 w-full justify-start px-2">
        <div className="flex grow flex-col justify-start items-start">
          <span className="flex-grow truncate overflow-hidden text-sm max-w-[100px]">
            {currentProject?.displayName}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          size={'sm'}
          aria-expanded={open}
          aria-label="Select a project"
          className="gap-2 w-full justify-start px-2"
        >
          <div className="flex grow flex-col justify-start items-start">
            <span className="flex-grow truncate overflow-hidden text-sm max-w-[100px]">
              {currentProject?.displayName}
            </span>
          </div>
          <CaretSortIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full max-w-full p-0">
        <Command filter={filterProjects}>
          <CommandList>
            <CommandInput placeholder="Search project..." />
            <CommandEmpty>{t('No projects found')}</CommandEmpty>
            {allProjects && Array.isArray(allProjects) &&
              allProjects.map((platform) => (
                <CommandGroup
                  key={platform.platformName}
                  heading={platform.platformName}
                >
                  <ScrollArea viewPortClassName="max-h-[200px]">
                    {platform.projects && Array.isArray(platform.projects) &&
                      platform.projects.map((project) => (
                        <CommandItem
                          key={project.id}
                          onSelect={() => {
                            setCurrentProject(
                              queryClient,
                              project,
                              location.pathname,
                            );
                            setOpen(false);
                          }}
                          value={project.id}
                          className="text-sm break-all"
                        >
                          {project.displayName}
                          <CheckIcon
                            className={cn(
                              'ml-auto h-4 w-4 shrink-0',
                              currentProject?.id === project.id
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                        </CommandItem>
                      ))}
                  </ScrollArea>
                </CommandGroup>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { ProjectSwitcher };
