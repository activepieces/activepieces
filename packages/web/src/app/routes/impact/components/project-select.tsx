import {
  PROJECT_COLOR_PALETTE,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown, LayoutGrid } from 'lucide-react';
import { useState } from 'react';

import { VirtualizedScrollArea } from '@/components/custom/virtualized-scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const ITEM_HEIGHT = 36;
const MAX_DROPDOWN_HEIGHT = 300;

type ProjectSelectProps = {
  projects: ProjectWithLimits[];
  selectedProjectId?: string;
  onProjectChange: (projectId: string) => void;
};

export function ProjectSelect({
  projects,
  selectedProjectId,
  onProjectChange,
}: ProjectSelectProps) {
  const [open, setOpen] = useState(false);

  const allProjectsItem = { id: 'all', displayName: t('All projects') };
  const items = [allProjectsItem, ...projects];

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  const displayValue = selectedProject?.displayName ?? t('All projects');

  const handleSelect = (projectId: string) => {
    onProjectChange(projectId);
    setOpen(false);
  };

  const dropdownHeight = Math.min(
    items.length * ITEM_HEIGHT,
    MAX_DROPDOWN_HEIGHT,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-auto font-normal"
        >
          {selectedProject?.type === ProjectType.TEAM ? (
            <Avatar
              className="size-4 shrink-0 flex items-center justify-center rounded-md text-xs font-semibold"
              style={{
                backgroundColor:
                  PROJECT_COLOR_PALETTE[selectedProject.icon.color].color,
                color:
                  PROJECT_COLOR_PALETTE[selectedProject.icon.color].textColor,
              }}
            >
              <span className="scale-75">
                {selectedProject.displayName.charAt(0).toUpperCase()}
              </span>
            </Avatar>
          ) : (
            <LayoutGrid />
          )}
          <span className="max-w-[150px] truncate">{displayValue}</span>
          <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="end">
        <div style={{ height: dropdownHeight }}>
          <VirtualizedScrollArea
            items={items}
            estimateSize={() => ITEM_HEIGHT}
            getItemKey={(index) => items[index].id}
            className="h-full"
            overscan={10}
            renderItem={(item) => {
              const isSelected =
                item.id === 'all'
                  ? !selectedProjectId
                  : item.id === selectedProjectId;
              const project =
                item.id !== 'all' ? (item as ProjectWithLimits) : null;
              const isTeam = project?.type === ProjectType.TEAM;
              return (
                <div
                  onClick={() => handleSelect(item.id)}
                  className={cn(
                    'flex h-9 cursor-pointer items-center gap-2 px-3 text-sm hover:bg-gray-4',
                    isSelected && 'bg-gray-4',
                  )}
                >
                  {isTeam && project ? (
                    <Avatar
                      className="size-5 shrink-0 flex items-center justify-center rounded-md text-xs font-semibold"
                      style={{
                        backgroundColor:
                          PROJECT_COLOR_PALETTE[project.icon.color].color,
                        color:
                          PROJECT_COLOR_PALETTE[project.icon.color].textColor,
                      }}
                    >
                      <span className="scale-75">
                        {item.displayName.charAt(0).toUpperCase()}
                      </span>
                    </Avatar>
                  ) : (
                    <LayoutGrid className="size-4 shrink-0 text-gray-11" />
                  )}
                  <span className="truncate flex-1">{item.displayName}</span>
                  <Check
                    className={cn(
                      'size-4 shrink-0',
                      isSelected ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </div>
              );
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
