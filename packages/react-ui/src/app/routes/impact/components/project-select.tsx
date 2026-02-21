import { t } from 'i18next';
import { Check, ChevronDown, LayoutGrid } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import { cn } from '@/lib/utils';
import { ProjectWithLimits } from '@activepieces/shared';

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

  const allProjectsItem = { id: 'all', displayName: t('All Projects') };
  const items = [allProjectsItem, ...projects];

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  const displayValue = selectedProject?.displayName ?? t('All Projects');

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
          className="w-auto gap-2 font-normal"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="max-w-[150px] truncate">{displayValue}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
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
            renderItem={(item) => (
              <div
                onClick={() => handleSelect(item.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent',
                  (item.id === 'all'
                    ? !selectedProjectId
                    : item.id === selectedProjectId) && 'bg-accent',
                )}
              >
                <Check
                  className={cn(
                    'h-4 w-4 shrink-0',
                    (
                      item.id === 'all'
                        ? !selectedProjectId
                        : item.id === selectedProjectId
                    )
                      ? 'opacity-100'
                      : 'opacity-0',
                  )}
                />
                <span className="truncate">{item.displayName}</span>
              </div>
            )}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
