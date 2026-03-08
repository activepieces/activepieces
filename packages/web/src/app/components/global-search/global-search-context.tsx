import { t } from 'i18next';
import { Compass, Workflow, Zap } from 'lucide-react';
import { createContext, useContext, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

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

export function GlobalSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) setSearch('');
  };

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
      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        showCloseButton={false}
        className="sm:max-w-[620px]"
      >
        <CommandInput
          placeholder={t('Search anything...')}
          value={search}
          onValueChange={setSearch}
        />
        <CommandList className="max-h-[420px] overflow-y-auto!">
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {t('No results found.')}
              </p>
              {search.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearch('')}
                >
                  {t('Clear Search')}
                </Button>
              )}
            </div>
          </CommandEmpty>
          <CommandGroup heading={t('Navigation')}>
            <CommandItem onSelect={() => handleOpenChange(false)}>
              <Compass />
              {t('Explore Templates')}
            </CommandItem>
            <CommandItem onSelect={() => handleOpenChange(false)}>
              <Workflow />
              {t('Automations')}
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={t('Recent')}>
            <CommandItem onSelect={() => handleOpenChange(false)}>
              <Zap />
              {t('My first flow')}
            </CommandItem>
            <CommandItem onSelect={() => handleOpenChange(false)}>
              <Zap />
              {t('Slack notification flow')}
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <div className="flex items-center gap-4 border-t px-4 py-2.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1 font-mono">
              ↑
            </kbd>
            <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1 font-mono">
              ↓
            </kbd>
            {t('to navigate')}
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1 font-mono">
              ↵
            </kbd>
            {t('to select')}
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px]">
              esc
            </kbd>
            {t('to close')}
          </span>
        </div>
      </CommandDialog>
    </GlobalSearchContext.Provider>
  );
}
