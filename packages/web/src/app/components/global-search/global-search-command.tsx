import { t } from 'i18next';
import { Search } from 'lucide-react';

import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useGlobalSearch } from './global-search-context';

export function GlobalSearchCommand() {
  const { setOpen } = useGlobalSearch();
  const { embedState } = useEmbedding();
  const isMac =
    typeof navigator !== 'undefined' && /(Mac)/i.test(navigator.userAgent);

  if (embedState.hideGlobalSearch) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      onClick={() => setOpen(true)}
      className={cn(
        'h-8 w-full justify-start gap-2 overflow-hidden rounded-md p-2!  text-sm font-normal mr-auto',
        'border border-gray-6 bg-gray-1 hover:bg-gray-4 hover:text-gray-12',
        'group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-2!',
      )}
    >
      <Search className="size-4 shrink-0 mr-auto" />
      <span className="flex-1 text-left text-gray-11 group-data-[collapsible=icon]:hidden">
        {t('Search...')}
      </span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded-md border bg-gray-3 py-0.5 px-1 font-mono text-sm font-medium sm:flex group-data-[collapsible=icon]:hidden!">
        {isMac ? '⌘' : 'Ctrl'}&nbsp;K
      </kbd>
    </Button>
  );
}
