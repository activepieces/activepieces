import { ProjectWithLimits } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

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
import { ApProjectDisplay, getProjectName } from '@/features/projects';
import { cn } from '@/lib/utils';

export function CreateProjectSelect({
  projects,
  value,
  onChange,
}: CreateProjectSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedProject = projects.find((p) => p.id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex max-w-[170px] items-center gap-1.5 rounded-full border border-border/60 bg-background/60 py-1 pl-2 pr-1.5 text-xs transition-colors',
            'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          {selectedProject ? (
            <ApProjectDisplay
              title={getProjectName(selectedProject)}
              icon={selectedProject.icon}
              projectType={selectedProject.type}
              iconClassName="size-3.5"
              titleClassName="text-xs"
              maxLengthToNotShowTooltip={18}
            />
          ) : (
            <span className="text-muted-foreground">
              {t('Select a project')}
            </span>
          )}
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <Command>
          <CommandInput placeholder={t('Search projects...')} />
          <CommandEmpty>{t('No project found.')}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {projects.map((project) => (
              <CommandItem
                key={project.id}
                value={getProjectName(project)}
                onSelect={() => {
                  onChange(project.id);
                  setOpen(false);
                }}
                className="cursor-pointer gap-2"
              >
                <ApProjectDisplay
                  title={getProjectName(project)}
                  icon={project.icon}
                  projectType={project.type}
                  iconClassName="size-4"
                />
                <Check
                  className={cn(
                    'ml-auto size-4',
                    value === project.id ? 'opacity-100' : 'opacity-0',
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

type CreateProjectSelectProps = {
  projects: ProjectWithLimits[];
  value: string | null;
  onChange: (projectId: string) => void;
};
