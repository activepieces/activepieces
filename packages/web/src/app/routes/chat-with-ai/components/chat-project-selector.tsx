import { Project, ProjectType } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown, FolderOpen, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ApProjectDisplay } from '@/features/projects';
import { cn } from '@/lib/utils';

function projectName(project: Project): string {
  return project.type === ProjectType.PERSONAL
    ? t('Personal Project')
    : project.displayName;
}

export function ChatProjectSelector({
  projects,
  selectedProjectId,
  onProjectChange,
}: ChatProjectSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-7 gap-1 rounded-full px-2.5 text-xs hover:text-foreground',
            selectedProject ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {selectedProject ? (
            <>
              <ApProjectDisplay
                title={projectName(selectedProject)}
                icon={selectedProject.icon}
                projectType={selectedProject.type}
                iconClassName="size-3.5"
                titleClassName="max-w-[120px] truncate text-xs"
              />
              <button
                type="button"
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onProjectChange(null);
                }}
              >
                <X className="size-2.5" />
              </button>
            </>
          ) : (
            <>
              <FolderOpen className="size-3" />
              <span>{t('Project')}</span>
            </>
          )}
          <ChevronDown className="size-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64" align="start">
        <Command>
          {projects.length > 5 && (
            <CommandInput placeholder={t('Search projects...')} />
          )}
          <CommandEmpty>{t('No project found.')}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {projects.map((project) => (
              <CommandItem
                key={project.id}
                value={projectName(project)}
                onSelect={() => {
                  onProjectChange(project.id);
                  setOpen(false);
                }}
                className="cursor-pointer gap-2"
              >
                <ApProjectDisplay
                  title={projectName(project)}
                  icon={project.icon}
                  projectType={project.type}
                  iconClassName="size-4"
                />
                <Check
                  className={cn(
                    'ml-auto size-4',
                    selectedProjectId === project.id
                      ? 'opacity-100'
                      : 'opacity-0',
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type ChatProjectSelectorProps = {
  projects: Project[];
  selectedProjectId: string | null;
  onProjectChange: (projectId: string | null) => void;
};
