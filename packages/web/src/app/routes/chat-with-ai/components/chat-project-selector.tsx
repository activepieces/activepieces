import { PROJECT_COLOR_PALETTE, Project } from '@activepieces/shared';
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
import { getProjectName } from '@/features/projects';
import { cn } from '@/lib/utils';

export function ChatProjectSelector({
  projects,
  selectedProjectId,
  onProjectChange,
}: ChatProjectSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  const selectedColor = selectedProject
    ? PROJECT_COLOR_PALETTE[selectedProject.icon.color]
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
              <span
                className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-sm shrink-0 text-[8px] font-bold"
                style={{
                  backgroundColor: selectedColor?.color,
                  color: selectedColor?.textColor,
                }}
              >
                {getProjectName(selectedProject).charAt(0).toUpperCase()}
              </span>
              <span className="max-w-[120px] truncate">
                {getProjectName(selectedProject)}
              </span>
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
            {projects.map((project) => {
              const color = PROJECT_COLOR_PALETTE[project.icon.color];
              return (
                <CommandItem
                  key={project.id}
                  value={getProjectName(project)}
                  onSelect={() => {
                    onProjectChange(project.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer gap-2"
                >
                  <span
                    className="inline-flex items-center justify-center h-5 w-5 rounded-sm shrink-0 text-[10px] font-bold"
                    style={{
                      backgroundColor: color.color,
                      color: color.textColor,
                    }}
                  >
                    {getProjectName(project).charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 truncate">
                    {getProjectName(project)}
                  </span>
                  <Check
                    className={cn(
                      'ml-auto size-4',
                      selectedProjectId === project.id
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                </CommandItem>
              );
            })}
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
