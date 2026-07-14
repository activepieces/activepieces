import {
  PROJECT_COLOR_PALETTE,
  PlatformRole,
  ProjectType,
  TeamProjectsLimit,
} from '@activepieces/shared';
import { t } from 'i18next';
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CreateProjectButton,
  getProjectName,
  projectCollectionUtils,
} from '@/features/projects';
import { ProjectLetterAvatar } from '@/features/projects/components/project-letter-avatar';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

import { recordAccess } from '../global-search/access-history';

import { useHoverOpenPopover } from './use-hover-open-popover';

export function ProjectSwitcher() {
  const { project: currentProject } =
    projectCollectionUtils.useCurrentProject();
  const { data: projects } = projectCollectionUtils.useAll();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: currentUser } = userHooks.useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    open,
    handleHoverEnter,
    handleHoverLeave,
    handleOpenChange,
    keepOpenOnClick,
    close,
  } = useHoverOpenPopover();

  const showNewProjectButton =
    platform.plan.teamProjectsLimit !== TeamProjectsLimit.NONE &&
    currentUser?.platformRole === PlatformRole.ADMIN;

  const handleSelect = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        const palette = project.icon
          ? PROJECT_COLOR_PALETTE[project.icon.color]
          : null;
        const name = getProjectName(project);
        recordAccess({
          id: `project-${projectId}`,
          type: 'project',
          label: name,
          href: `/projects/${projectId}/automations`,
          iconBgColor: palette?.color,
          iconTextColor: palette?.textColor,
          iconLetter: name.charAt(0).toUpperCase(),
        });
      }
      // Land on the same section in the target project, keeping any docked
      // chat (?chat=) attached across the switch.
      const section =
        PROJECT_SECTION_REGEX.exec(location.pathname)?.[1] ?? 'automations';
      const chat = new URLSearchParams(location.search).get('chat');
      projectCollectionUtils.setCurrentProject(
        projectId,
        `/projects/${projectId}/${section}${chat ? `?chat=${chat}` : ''}`,
      );
      close();
    },
    [projects, location.pathname, location.search, close],
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="pointer-events-auto h-auto min-w-0 gap-2 rounded-md px-1.5 py-1 font-medium"
          onMouseEnter={handleHoverEnter}
          onMouseLeave={handleHoverLeave}
          onClick={keepOpenOnClick}
        >
          <ProjectLetterAvatar project={currentProject} className="size-4" />
          <span className="truncate max-w-[200px] text-sm leading-5">
            {getProjectName(currentProject)}
          </span>
          {currentProject.type === ProjectType.PERSONAL && (
            <TooltipProvider delayDuration={400}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="rounded-[4px] bg-muted px-1.5 text-xs font-medium text-muted-foreground"
                  >
                    {t('Personal')}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t('Only you can access it.')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="pointer-events-auto w-[300px] p-0"
        align="start"
        onMouseEnter={handleHoverEnter}
        onMouseLeave={handleHoverLeave}
      >
        <Command>
          <CommandInput placeholder={t('Search Projects')} />
          <CommandList>
            <CommandEmpty>{t('No projects found.')}</CommandEmpty>
            <ScrollArea className="h-full" viewPortClassName="max-h-[300px]">
              <CommandGroup>
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={`${getProjectName(project)}-${project.id}`}
                    className="gap-2"
                    onSelect={() => handleSelect(project.id)}
                  >
                    <ProjectLetterAvatar project={project} />
                    <span className="truncate">{getProjectName(project)}</span>
                    {project.type === ProjectType.PERSONAL && (
                      <TooltipProvider delayDuration={400}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="secondary"
                              className="ml-auto rounded-[4px] bg-muted px-1.5 text-xs font-medium text-muted-foreground"
                            >
                              {t('Personal')}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            {t('Only you can access it.')}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
          {showNewProjectButton && (
            <div className="border-t p-1.5">
              <CreateProjectButton
                variant="ghost"
                projects={projects}
                onCreate={(project) => {
                  close();
                  navigate(`/projects/${project.id}/automations`);
                }}
              />
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const PROJECT_SECTION_REGEX = /^\/projects\/[^/]+\/([^/]+)/;
