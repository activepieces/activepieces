import { t } from 'i18next';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useGlobalSearch } from './global-search-context';

export function GlobalSearchCommand() {
  const { setOpen } = useGlobalSearch();
  const isMac =
    typeof navigator !== 'undefined' && /(Mac)/i.test(navigator.userAgent);

  return (
    <Button
      variant="ghost"
      onClick={() => setOpen(true)}
      className={cn(
        'h-8 w-full justify-start gap-2 overflow-hidden rounded-md p-2!  text-sm font-normal mr-auto',
        'border border-sidebar-border bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-2!',
      )}
    >
      <Search className="size-4 shrink-0 mr-auto" />
      <span className="flex-1 text-left text-muted-foreground group-data-[collapsible=icon]:hidden">
        {t('Search...')}
      </span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted py-0.5 px-1 font-mono text-[9px] font-medium sm:flex group-data-[collapsible=icon]:hidden!">
        {isMac ? '⌘' : 'Ctrl'}&nbsp;K
      </kbd>
    </Button>
  );
}
