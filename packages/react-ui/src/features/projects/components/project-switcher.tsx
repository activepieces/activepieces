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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar-shadcn';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import { ScrollArea } from '../../../components/ui/scroll-area';
import { projectHooks } from '../../../hooks/project-hooks';

export function ProjectSwitcher() {
  const location = useLocation();
  const branding = flagsHooks.useWebsiteBranding();
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
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="px-2 gap-x-3">
              <div className="flex aspect-square size-8 border items-center justify-center rounded-lg">
                <img
                  src={branding.logos.logoIconUrl}
                  alt={t('home')}
                  className="h-5 w-5 object-contain"
                />
              </div>
              <h1 className="truncate font-semibold">
                {currentProject?.displayName}
              </h1>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-64 p-0 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <Command filter={filterProjects}>
              <CommandList>
                <CommandInput placeholder="Search project..." />
                {allProjects &&
                  allProjects.map((platform) => (
                    <CommandGroup
                      key={platform.platformName}
                      heading={platform.platformName}
                    >
                      <ScrollArea viewPortClassName="max-h-[200px]">
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
                      </ScrollArea>

                      <CommandEmpty>{t('No projects found')}</CommandEmpty>
                    </CommandGroup>
                  ))}
              </CommandList>
            </Command>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
