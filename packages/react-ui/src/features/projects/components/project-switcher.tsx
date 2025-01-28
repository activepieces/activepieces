'use client';

import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import * as React from 'react';
import { useLocation } from 'react-router-dom';

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
import { cn } from '@/lib/utils';

import { ScrollArea } from '../../../components/ui/scroll-area';
import { projectHooks } from '../../../hooks/project-hooks';

function ProjectSwitcher() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: projects } = projectHooks.useProjects();
  const [open, setOpen] = React.useState(false);
  const { embedState } = useEmbedding();
  const { data: currentProject, setCurrentProject } =
    projectHooks.useCurrentProject();
  const filterProjects = React.useCallback(
    (projectId: string, search: string) => {
      //Radix UI lowercases the value string (projectId)
      const project = projects?.find(
        (project) => project.id.toLowerCase() === projectId,
      );
      if (!project) {
        return 0;
      }
      return project.displayName.toLowerCase().includes(search.toLowerCase())
        ? 1
        : 0;
    },
    [projects],
  );
  const sortedProjects = (projects ?? []).sort((a, b) => {
    return a.displayName.localeCompare(b.displayName);
  });

  if (embedState.isEmbedded) {
    return null;
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
          className="gap-2 max-w-[200px] justify-between"
        >
          <span className="truncate">{currentProject?.displayName}</span>
          <CaretSortIcon className="ml-auto size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-[200px] p-0">
        <Command filter={filterProjects}>
          <CommandList>
            <CommandInput placeholder="Search project..." />
            <CommandEmpty>{t('No projects found')}</CommandEmpty>
            <CommandGroup key="projects" heading="Projects">
              <ScrollArea viewPortClassName="max-h-[200px]">
                {sortedProjects &&
                  sortedProjects.map((project) => (
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { ProjectSwitcher };
