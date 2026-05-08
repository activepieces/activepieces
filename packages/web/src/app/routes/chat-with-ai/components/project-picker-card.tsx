import { ProjectType } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Ellipsis } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';

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
import {
  ApProjectDisplay,
  getProjectName,
  projectCollectionUtils,
} from '@/features/projects';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

import { ProjectPickerData } from '../lib/message-parsers';

export function ProjectPickerCard({
  picker,
  onSelect,
  isInteractive = true,
  selectedProjectId,
}: ProjectPickerCardProps) {
  const { data: allProjects } = projectCollectionUtils.useAll();
  const { data: currentUser } = userHooks.useCurrentUser();
  const projects = useMemo(() => {
    const all = allProjects ?? [];
    if (!currentUser) return all;
    return all.filter(
      (p) => p.type !== ProjectType.PERSONAL || p.ownerId === currentUser.id,
    );
  }, [allProjects, currentUser]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function handleSelect(projectId: string, name: string) {
    setSelected(projectId);
    onSelect(projectId, name);
  }

  if (selected || !isInteractive) {
    const projectId = selected ?? selectedProjectId;
    const resolvedProject = projectId
      ? projects.find((p) => p.id === projectId)
      : null;
    const displayName = resolvedProject
      ? getProjectName(resolvedProject)
      : projectId
      ? picker.suggestedProjects.find((p) => p.id === projectId)?.name ?? ''
      : picker.suggestedProjects[0]?.name ?? '';
    return (
      <motion.div
        className="flex flex-wrap gap-2 my-2"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3 py-1.5 text-sm">
          {resolvedProject ? (
            <ApProjectDisplay
              title={getProjectName(resolvedProject)}
              icon={resolvedProject.icon}
              projectType={resolvedProject.type}
              iconClassName="size-4"
              titleClassName="text-sm"
            />
          ) : (
            displayName && <span className="text-sm">{displayName}</span>
          )}
          <Check className="size-3.5 text-green-600 dark:text-green-400" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-wrap gap-2 my-2"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {picker.suggestedProjects
        .filter((s) => projects.some((p) => p.id === s.id))
        .map((suggested, i) => {
          const resolvedProject = projects.find((p) => p.id === suggested.id);
          return (
            <motion.button
              key={suggested.id}
              type="button"
              onClick={() =>
                handleSelect(
                  suggested.id,
                  resolvedProject
                    ? getProjectName(resolvedProject)
                    : suggested.name,
                )
              }
              className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm hover:bg-muted transition-colors cursor-pointer"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              {resolvedProject ? (
                <ApProjectDisplay
                  title={getProjectName(resolvedProject)}
                  icon={resolvedProject.icon}
                  projectType={resolvedProject.type}
                  iconClassName="size-4"
                  titleClassName="text-sm"
                />
              ) : (
                <span>{suggested.name}</span>
              )}
            </motion.button>
          );
        })}

      <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <PopoverTrigger asChild>
          <motion.button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.2,
              delay: picker.suggestedProjects.length * 0.04,
            }}
          >
            <Ellipsis className="size-3.5" />
            {t('Another project')}
          </motion.button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-72" align="start">
          <Command>
            <CommandInput placeholder={t('Search projects...')} />
            <CommandEmpty>{t('No project found.')}</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={getProjectName(project)}
                  onSelect={() => {
                    handleSelect(project.id, getProjectName(project));
                    setDropdownOpen(false);
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
    </motion.div>
  );
}

type ProjectPickerCardProps = {
  picker: ProjectPickerData;
  onSelect: (projectId: string, projectName: string) => void;
  isInteractive?: boolean;
  selectedProjectId?: string | null;
};
