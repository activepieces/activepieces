'use client';

import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

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

import { projectHooks } from '../lib/project-hooks';

function ProjectSwitcher() {
  const queryClient = useQueryClient();
  const { data: projects } = projectHooks.useProjects();
  const [open, setOpen] = React.useState(false);
  const { data: currentProject, setCurrentProject } =
    projectHooks.useCurrentProject();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a project"
          className="w-[200px] justify-between"
        >
          {currentProject?.displayName}
          <CaretSortIcon className="ml-auto size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search project..." />
            <CommandEmpty>No projects found.</CommandEmpty>
            <CommandGroup key="projects" heading="Projects">
              {projects &&
                projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    onSelect={() => {
                      setCurrentProject(queryClient, project);
                      setOpen(false);
                    }}
                    className="text-sm"
                  >
                    {project.displayName}
                    <CheckIcon
                      className={cn(
                        'ml-auto h-4 w-4',
                        currentProject?.id === project.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { ProjectSwitcher };
