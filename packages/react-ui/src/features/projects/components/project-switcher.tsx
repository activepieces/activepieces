import { CheckIcon } from '@radix-ui/react-icons';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import { useLocation } from 'react-router-dom';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton } from '@/components/ui/sidebar-shadcn';
import { cn } from '@/lib/utils';

import { ScrollArea } from '../../../components/ui/scroll-area';
import { projectHooks } from '../../../hooks/project-hooks';

export function ProjectSwitcher() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: allProjects } = projectHooks.useProjectsForPlatforms();
  const { data: currentProject, setCurrentProject } =
    projectHooks.useCurrentProject();

  const filterProjects = React.useCallback(
    (value: string, search: string) => {
      const project = allProjects
        ?.flatMap((p) => p.projects)
        .find((p) => p.id.toLowerCase() === value.toLowerCase());

      if (!project) return 0;

      return project.displayName.toLowerCase().includes(search.toLowerCase())
        ? 1
        : 0;
    },
    [allProjects],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton className="px-2 h-9 gap-x-3">
          <h1 className="truncate font-semibold">
            {currentProject?.displayName}
          </h1>
          <ChevronsUpDown className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56 p-0 rounded-lg"
        align="start"
        side="right"
        sideOffset={4}
      >
        <Command filter={filterProjects}>
          <CommandList>
            <CommandInput placeholder="Search project..." />
            {allProjects &&
              allProjects.map((platform) => (
                <ScrollArea
                  viewPortClassName="max-h-[200px]"
                  key={platform.platformName}
                >
                  <CommandGroup heading={platform.platformName}>
                    {platform.projects &&
                      platform.projects.map((project) => (
                        <CommandItem
                          key={project.id}
                          onSelect={() => {
                            setCurrentProject(
                              queryClient,
                              project,
                              location.pathname,
                            );
                          }}
                          value={project.id}
                          className="text-sm p-2 break-all"
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

                    <CommandEmpty>{t('No projects found')}</CommandEmpty>
                  </CommandGroup>
                </ScrollArea>
              ))}
          </CommandList>
        </Command>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
