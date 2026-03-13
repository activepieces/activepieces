import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { projectCollectionUtils } from '@/features/projects';

import {
  addToSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  type SearchHistoryItem,
} from './search-history';
import { HistoryResultRow, SearchResultRow } from './search-result-item';
import {
  type SearchResultItem,
  useGlobalSearchResults,
} from './use-global-search-results';

type GlobalSearchContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const GlobalSearchContext = createContext<GlobalSearchContextType | null>(null);

export function useGlobalSearch() {
  const ctx = useContext(GlobalSearchContext);
  if (!ctx) {
    throw new Error('useGlobalSearch must be used within GlobalSearchProvider');
  }
  return ctx;
}

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-2">
          <div className="size-4 shrink-0 animate-pulse rounded bg-muted" />
          <div className="h-3.5 flex-1 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </>
  );
}

function GlobalSearchDialogContent({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [commandValue, setCommandValue] = useState('');
  const [debouncedSearch] = useDebounce(search, 250);

  const { groups, isLoading } = useGlobalSearchResults(debouncedSearch, open);

  useEffect(() => {
    if (open) {
      setHistory(getSearchHistory());
    }
  }, [open, queryClient]);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      onOpenChange(value);
      if (!value) setSearch('');
    },
    [onOpenChange],
  );

  const navigateToItem = useCallback(
    (type: string, href: string) => {
      if (type === 'project') {
        const projectId = href.split('/projects/')[1]?.split('/')[0];
        if (projectId) projectCollectionUtils.setCurrentProject(projectId);
      }
      navigate(href);
      handleOpenChange(false);
    },
    [navigate, handleOpenChange],
  );

  const handleSelectResult = useCallback(
    (item: SearchResultItem) => {
      addToSearchHistory({
        id: item.id,
        type: item.type,
        label: item.label,
        href: item.href,
        status: item.status,
        folderName: item.folderName,
        projectName: item.projectName,
        iconBgColor: item.iconBgColor,
        iconTextColor: item.iconTextColor,
        iconLetter: item.iconLetter,
      });
      navigateToItem(item.type, item.href);
    },
    [navigateToItem],
  );

  const handleSelectHistory = useCallback(
    (item: SearchHistoryItem) => {
      addToSearchHistory({ ...item });
      navigateToItem(item.type, item.href);
    },
    [navigateToItem],
  );

  const hasQuery = debouncedSearch.length > 0;
  const noResults = hasQuery && !isLoading && groups.length === 0;

  const TYPE_CATEGORIES = [
    { type: 'flow', heading: t('Flows') },
    { type: 'table', heading: t('Tables') },
    { type: 'folder', heading: t('Folders') },
    { type: 'project', heading: t('Projects') },
    { type: 'page', heading: t('Pages') },
  ] as const;

  const mergedGroups = !hasQuery
    ? TYPE_CATEGORIES.map(({ type, heading }) => {
        const historyItems = history.filter((h) => h.type === type).slice(0, 5);
        const suggestionGroup = groups.find((g) => g.type === type);
        const useHistory = historyItems.length > 0;
        return {
          type,
          heading,
          historyItems,
          useHistory,
          isLoading: !useHistory && (suggestionGroup?.isLoading ?? false),
          suggestionItems: suggestionGroup?.items ?? [],
        };
      }).filter(
        (g) => g.useHistory || g.isLoading || g.suggestionItems.length > 0,
      )
    : [];

  const hasHistory = history.length > 0;

  const firstItemId = hasQuery
    ? groups.find((g) => !g.isLoading && g.items.length > 0)?.items[0]?.id ?? ''
    : (() => {
        for (const g of mergedGroups) {
          if (g.useHistory && g.historyItems.length > 0)
            return g.historyItems[0].id;
          if (!g.useHistory && !g.isLoading && g.suggestionItems.length > 0)
            return g.suggestionItems[0].id;
        }
        return '';
      })();

  useEffect(() => {
    setCommandValue(firstItemId);
  }, [firstItemId]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      showCloseButton={false}
      shouldFilter={false}
      commandValue={commandValue}
      onCommandValueChange={setCommandValue}
      className="sm:max-w-[620px]"
    >
      <CommandInput
        placeholder={t('Search pages, flows, tables...')}
        value={search}
        onValueChange={setSearch}
      />

      <CommandList className="max-h-[620px] overflow-y-auto! scrollbar-hover">
        {!hasQuery &&
          mergedGroups.map((group, idx) => (
            <React.Fragment key={group.type}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={group.heading}>
                {group.isLoading ? (
                  <SkeletonRows />
                ) : group.useHistory ? (
                  group.historyItems.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelectHistory(item)}
                      className="flex items-center"
                    >
                      <HistoryResultRow item={item} />
                    </CommandItem>
                  ))
                ) : (
                  group.suggestionItems.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelectResult(item)}
                      className="flex items-center"
                    >
                      <SearchResultRow item={item} />
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </React.Fragment>
          ))}

        {noResults && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {t('No results found.')}
            </p>
            <button
              type="button"
              className="text-xs text-primary underline hover:no-underline"
              onClick={() => setSearch('')}
            >
              {t('Clear search')}
            </button>
          </div>
        )}

        {hasQuery &&
          groups.map((group, idx) => (
            <React.Fragment key={group.type}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={group.heading}>
                {group.isLoading ? (
                  <SkeletonRows />
                ) : (
                  group.items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelectResult(item)}
                      className="flex items-center"
                    >
                      <SearchResultRow item={item} />
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </React.Fragment>
          ))}
      </CommandList>

      <div className="flex items-center gap-4 border-t bg-muted/50 px-4 py-2.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <kbd className="inline-flex h-5 items-center rounded border bg-background px-1 font-mono">
            ↑
          </kbd>
          <kbd className="inline-flex h-5 items-center rounded border bg-background px-1 font-mono">
            ↓
          </kbd>
          {t('to navigate')}
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="inline-flex h-5 items-center rounded border bg-background px-1 font-mono">
            ↵
          </kbd>
          {t('to select')}
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="inline-flex h-5 items-center rounded border bg-background px-1.5 font-mono text-[10px]">
            esc
          </kbd>
          {t('to close')}
        </span>
        {!hasQuery && hasHistory && (
          <button
            className="ml-auto text-[11px] text-muted-foreground underline hover:no-underline"
            onClick={() => {
              clearSearchHistory();
              setHistory([]);
            }}
          >
            {t('Clear history')}
          </button>
        )}
      </div>
    </CommandDialog>
  );
}

export function GlobalSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <GlobalSearchContext.Provider value={{ open, setOpen }}>
      {children}
      <GlobalSearchDialogContent open={open} onOpenChange={setOpen} />
    </GlobalSearchContext.Provider>
  );
}
