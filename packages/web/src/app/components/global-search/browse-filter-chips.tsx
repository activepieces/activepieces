import { t } from 'i18next';

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
  const chips = CHIP_DEFS.filter(
    (chip) => !(chip.value === 'tables' && hideTables),
  );

  return (
    <div className="flex items-center gap-1.5">
      {chips.map((chip) => {
        const isActive = chip.value === active;
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onSelect(chip.value)}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

const CHIP_DEFS: { value: ProjectFilter; label: string }[] = [
  { value: 'all', label: t('All') },
  { value: 'flows', label: t('Flows') },
  { value: 'tables', label: t('Tables') },
  { value: 'active', label: t('Active') },
];
