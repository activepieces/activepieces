import { t } from 'i18next';
import { CornerDownLeft, X } from 'lucide-react';
import React, {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
} from '@/components/ui/empty';
import { Kbd } from '@/components/ui/kbd';
import { Skeleton } from '@/components/ui/skeleton';
import { projectCollectionUtils } from '@/features/projects';

import { AccountSettingsDialog } from '../account-settings';
import { ProjectSettingsDialog } from '../project-settings';

import { recordAccess, type AccessedItemType } from './access-history';
import { SearchResultRow } from './search-result-item';
import { type ProjectSettingsTab } from './settings-index';
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
        <div key={i} className="flex items-center gap-2 p-2">
          <Skeleton className="size-4 shrink-0 rounded-md" />
          <Skeleton className="h-3.5 flex-1 rounded-md" />
          <Skeleton className="h-3.5 w-24 rounded-md" />
        </div>
      ))}
    </>
  );
}

type SettingsDialogState =
  | { dialog: 'project'; tab: ProjectSettingsTab }
  | { dialog: 'account' }
  | null;

function ProjectSettingsFromSearch({
  tab,
  onClose,
}: {
  tab: ProjectSettingsTab;
  onClose: () => void;
}) {
  const { project } = projectCollectionUtils.useCurrentProject();
  return (
    <ProjectSettingsDialog
      open={true}
      onClose={onClose}
      initialTab={tab}
      initialValues={{ projectName: project.displayName }}
    />
  );
}

function GlobalSearchDialogContent({
  open,
  onOpenChange,
  onOpenSettings,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOpenSettings: (state: SettingsDialogState) => void;
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [commandValue, setCommandValue] = useState('');
  const [debouncedSearch] = useDebounce(search, 250);

  const { groups, isLoading } = useGlobalSearchResults(debouncedSearch, open);

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
      const target = item.settingsTarget;
      if (target && target.type !== 'route') {
        handleOpenChange(false);
        onOpenSettings(
          target.type === 'project-settings'
            ? { dialog: 'project', tab: target.tab }
            : { dialog: 'account' },
        );
        return;
      }
      if (!target && item.type !== 'folder') {
        recordAccess({
          id: item.id,
          type: item.type as AccessedItemType,
          label: item.label,
          href: item.href,
          status: item.status,
          folderName: item.folderName,
          projectName: item.projectName,
          iconBgColor: item.iconBgColor,
          iconTextColor: item.iconTextColor,
          iconLetter: item.iconLetter,
        });
      }
      navigateToItem(item.type, item.href);
    },
    [navigateToItem, handleOpenChange, onOpenSettings],
  );

  const hasQuery = debouncedSearch.length > 0;
  const noResults = hasQuery && !isLoading && groups.length === 0;

  const firstItemId =
    groups.find((g) => !g.isLoading && g.items.length > 0)?.items[0]?.id ?? '';

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
      className="flex h-[70vh] flex-col sm:max-w-[620px]"
    >
      <div className="relative">
        <CommandInput
          placeholder={t('Search pages, settings, flows, tables...')}
          value={search}
          onValueChange={setSearch}
          containerClassName="border-b-0"
        />
        {search && (
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-11 transition-colors hover:text-gray-12"
            onClick={() => setSearch('')}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <CommandList className="max-h-none min-h-0 flex-1 overflow-y-auto!">
        {noResults && (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyDescription>{t('No results found.')}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="link" onClick={() => setSearch('')}>
                {t('Clear search')}
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {groups.map((group, idx) => (
          <React.Fragment key={group.type}>
            {idx > 0 && hasQuery && <CommandSeparator />}
            <CommandGroup heading={group.heading || undefined}>
              {group.isLoading ? (
                <SkeletonRows />
              ) : (
                group.items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelectResult(item)}
                    className="group"
                  >
                    <SearchResultRow
                      item={item}
                      query={hasQuery ? debouncedSearch : undefined}
                    />
                    <CornerDownLeft className="ml-auto size-2 shrink-0 text-gray-11 opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>

      <div className="flex items-center gap-4 border-t bg-gray-2 px-4 py-2.5 text-xs text-gray-11">
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          {t('to navigate')}
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>↵</Kbd>
          {t('to select')}
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>esc</Kbd>
          {t('to close')}
        </span>
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
  const [settingsDialog, setSettingsDialog] =
    useState<SettingsDialogState>(null);
  const { embedState } = useEmbedding();
  const { hideGlobalSearch } = embedState;

  useEffect(() => {
    if (hideGlobalSearch) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hideGlobalSearch]);

  return (
    <GlobalSearchContext.Provider value={{ open, setOpen }}>
      {children}
      {!hideGlobalSearch && (
        <GlobalSearchDialogContent
          open={open}
          onOpenChange={setOpen}
          onOpenSettings={setSettingsDialog}
        />
      )}
      {settingsDialog?.dialog === 'project' && (
        <Suspense fallback={null}>
          <ProjectSettingsFromSearch
            tab={settingsDialog.tab}
            onClose={() => setSettingsDialog(null)}
          />
        </Suspense>
      )}
      <AccountSettingsDialog
        open={settingsDialog?.dialog === 'account'}
        onClose={() => setSettingsDialog(null)}
      />
    </GlobalSearchContext.Provider>
  );
}
