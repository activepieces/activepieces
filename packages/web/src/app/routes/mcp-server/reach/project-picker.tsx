import { t } from 'i18next';
import { Check, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ApProjectDisplay,
  getProjectName,
  projectCollectionUtils,
} from '@/features/projects';
import { cn } from '@/lib/utils';

type ProjectPickerProps = {
  projectId: string;
  onSelect: (projectId: string) => void;
};

export function ProjectPicker({ projectId, onSelect }: ProjectPickerProps) {
  const { data: projects = [] } = projectCollectionUtils.useAll();
  const selected = projects.find((project) => project.id === projectId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 gap-2 px-3">
          <span className="text-muted-foreground">{t('Project')}</span>
          {selected ? (
            <ApProjectDisplay
              title={getProjectName(selected)}
              icon={selected.icon}
              projectType={selected.type}
              iconClassName="size-[18px] text-[11px]"
              titleClassName="font-medium"
              maxLengthToNotShowTooltip={24}
            />
          ) : (
            <span className="font-medium">{t('Select a project')}</span>
          )}
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[240px]">
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            className="gap-2"
            onSelect={() => onSelect(project.id)}
          >
            <ApProjectDisplay
              title={getProjectName(project)}
              icon={project.icon}
              projectType={project.type}
              iconClassName="size-[18px] text-[11px]"
              maxLengthToNotShowTooltip={24}
            />
            <Check
              className={cn('ml-auto size-4', {
                'opacity-0': project.id !== projectId,
              })}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
