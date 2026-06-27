import { t } from 'i18next';
import { Search } from 'lucide-react';

import { BrowseFilterChips } from './browse-filter-chips';
import {
  makeSearchKeyDown,
  ResultGroups,
  ScopeToggle,
} from './browse-style-shared';
import { type BrowseController } from './use-browse-controller';

export function StyleSections({
  controller,
}: {
  controller: BrowseController;
}) {
  const isProject = controller.category === 'project';
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3.5 px-5 pb-3 pt-4">
        <Search className="size-5 shrink-0 text-muted-foreground/45" />
        <input
          autoFocus
          value={controller.search}
          onChange={(e) => controller.setSearch(e.target.value)}
          onKeyDown={makeSearchKeyDown(controller)}
          placeholder={t('Search')}
          className="w-full bg-transparent text-lg font-normal tracking-[-0.01em] outline-none placeholder:text-muted-foreground/35"
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-foreground/[0.06] px-3 py-2">
        <ScopeToggle controller={controller} />
        {isProject && (
          <BrowseFilterChips
            active={controller.projectFilter}
            onSelect={controller.setProjectFilter}
            hideTables={controller.hideTables}
          />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 scrollbar-hover">
        <ResultGroups
          controller={controller}
          density="cozy"
          heading={(text) => (
            <div className="flex items-center gap-2 px-2.5 pb-1.5 pt-3 first:pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/45">
                {text}
              </span>
              <span className="h-px flex-1 bg-foreground/[0.05]" />
            </div>
          )}
        />
      </div>
    </div>
  );
}
