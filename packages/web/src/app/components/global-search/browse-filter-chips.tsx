import { t } from 'i18next';
import { Table2, Workflow } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { type ProjectFilter } from './use-browse-navigation';

export function BrowseFilterChips({
  active,
  onSelect,
  hideTables,
}: {
  active: ProjectFilter;
  onSelect: (filter: ProjectFilter) => void;
  hideTables?: boolean;
}) {
  const isActive = (value: ProjectFilter) => value === active;
  const chip = (value: ProjectFilter) =>
    cn(
      'flex h-8 items-center justify-center rounded-lg text-sm font-medium transition-colors',
      isActive(value)
        ? 'bg-foreground/[0.08] text-foreground'
        : 'text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground',
    );

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onSelect('all')}
        onMouseDown={(e) => e.preventDefault()}
        className={cn(chip('all'), 'px-3')}
      >
        {t('All')}
      </button>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={t('Flows')}
            onClick={() => onSelect('flows')}
            onMouseDown={(e) => e.preventDefault()}
            className={cn(chip('flows'), 'w-8')}
          >
            <Workflow className="size-[18px]" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t('Flows')}</TooltipContent>
      </Tooltip>
      {!hideTables && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t('Tables')}
              onClick={() => onSelect('tables')}
              onMouseDown={(e) => e.preventDefault()}
              className={cn(chip('tables'), 'w-8')}
            >
              <Table2 className="size-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('Tables')}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
