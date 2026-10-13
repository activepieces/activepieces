import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

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
import {
  ApProjectDisplay,
  getProjectName,
  projectCollectionUtils,
} from '@/features/projects';
import { cn } from '@/lib/utils';

import { projectPickerUtils } from './project-picker-utils';

type ProjectPickerProps = {
  projectId: string | null;
  allowedProjectIds?: string[] | null;
  onSelect: (projectId: string) => void;
};

export function ProjectPicker({
  projectId,
  allowedProjectIds,
  onSelect,
}: ProjectPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: allProjects = [] } = projectCollectionUtils.useAll();
  const projects = isNil(allowedProjectIds)
    ? allProjects
    : allProjects.filter((project) => allowedProjectIds.includes(project.id));
  const selectedProject = projects.find((project) => project.id === projectId);
  const { visible, total } = projectPickerUtils.filter({
    projects,
    search,
    selectedId: projectId,
    limit: VISIBLE_LIMIT,
  });

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSearch('');
    }
  };

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open}>
          <span className="text-gray-11">{t('Project')}</span>
          {selectedProject ? (
            <ApProjectDisplay
              title={getProjectName(selectedProject)}
              icon={selectedProject.icon}
              projectType={selectedProject.type}
              iconClassName="size-4.5 text-xs"
              titleClassName="font-medium"
              maxLengthToNotShowTooltip={24}
            />
          ) : (
            <span className="font-medium">{t('Select a project')}</span>
          )}
          <ChevronDown className="size-4 text-gray-11" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[300px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={t('Search projects...')}
          />
          <CommandList className="overflow-y-auto">
            <CommandEmpty>{t('No projects found')}</CommandEmpty>
            <CommandGroup>
              {visible.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.id}
                  data-project-item="true"
                  className="gap-2"
                  onSelect={() => {
                    onSelect(project.id);
                    changeOpen(false);
                  }}
                >
                  <ApProjectDisplay
                    title={getProjectName(project)}
                    icon={project.icon}
                    projectType={project.type}
                    iconClassName="size-4.5 text-xs"
                    maxLengthToNotShowTooltip={24}
                  />
                  <Check
                    className={cn('ml-auto size-4', {
                      'opacity-0': project.id !== projectId,
                    })}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {total > visible.length && (
            <p className="border-t px-3 py-2 text-xs text-gray-11">
              {t(
                'Showing {shown} of {total}. Refine your search to see more.',
                {
                  shown: visible.length,
                  total,
                },
              )}
            </p>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const VISIBLE_LIMIT = 50;
