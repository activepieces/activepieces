import { t } from 'i18next';
import { Search } from 'lucide-react';

import { BrowseFilterChips } from './browse-filter-chips';
import {
  makeSearchKeyDown,
  ResultGroups,
  ScopeToggle,
} from './browse-style-shared';
import { type BrowseController } from './use-browse-controller';

export function StyleFocus({ controller }: { controller: BrowseController }) {
  const isProject = controller.category === 'project';
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 px-7 pb-5 pt-8">
        <Search className="size-7 shrink-0 text-muted-foreground/30" />
        <input
          autoFocus
          value={controller.search}
          onChange={(e) => controller.setSearch(e.target.value)}
          onKeyDown={makeSearchKeyDown(controller)}
          placeholder={t('Search')}
          className="w-full bg-transparent text-[30px] font-light tracking-[-0.025em] outline-none placeholder:text-muted-foreground/25"
        />
      </div>

      <div className="flex flex-col items-center gap-3 px-6 pb-4">
        <ScopeToggle controller={controller} align="center" />
        {isProject && (
          <BrowseFilterChips
            active={controller.projectFilter}
            onSelect={controller.setProjectFilter}
            hideTables={controller.hideTables}
          />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 scrollbar-hover">
        <ResultGroups controller={controller} density="airy" />
      </div>
    </div>
  );
}
