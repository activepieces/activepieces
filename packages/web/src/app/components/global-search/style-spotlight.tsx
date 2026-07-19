import { t } from 'i18next';
import { Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { BrowseFilterChips } from './browse-filter-chips';
import {
  makeSearchKeyDown,
  ResultGroups,
  ScopeToggle,
} from './browse-style-shared';
import { type BrowseController } from './use-browse-controller';

export function StyleSpotlight({
  controller,
}: {
  controller: BrowseController;
}) {
  const isProject = controller.category === 'project';
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 pb-3 pt-3.5">
        <Search className="size-[18px] shrink-0 text-muted-foreground/40" />
        <input
          ref={inputRef}
          autoFocus
          value={controller.search}
          onChange={(e) => controller.setSearch(e.target.value)}
          onKeyDown={makeSearchKeyDown(controller)}
          placeholder={t('Search')}
          className="w-full bg-transparent text-lg font-light tracking-[-0.02em] outline-none placeholder:text-muted-foreground/30"
        />
        {controller.search && (
          <button
            type="button"
            onClick={() => controller.setSearch('')}
            onMouseDown={(e) => e.preventDefault()}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
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
        <ResultGroups controller={controller} density="cozy" />
      </div>
    </div>
  );
}
