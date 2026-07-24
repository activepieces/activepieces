import { t } from 'i18next';
import { Briefcase, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { GeneralSection } from './sections/memory/general-section';
import { MemorySection } from './sections/memory/memory-section';

const TABS = [
  {
    id: 'capabilities',
    label: 'Capabilities',
    icon: Briefcase,
    sections: [
      { id: 'general', label: 'General', render: () => <GeneralSection /> },
      { id: 'memory', label: 'Memory', render: () => <MemorySection /> },
    ],
  },
] as const;

function highlightMatch(text: string, query: string) {
  const q = query.trim();
  const idx = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-primary">{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  );
}

function SettingsHubContent() {
  const [activeTabId, setActiveTabId] = useState<string>(TABS[0].id);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return TABS.flatMap((tab) =>
      tab.sections
        .filter(
          (section) =>
            section.label.toLowerCase().includes(q) ||
            tab.label.toLowerCase().includes(q),
        )
        .map((section) => ({ tab, section })),
    );
  }, [query]);

  const activeTab = TABS.find((tab) => tab.id === activeTabId) ?? TABS[0];

  const goToSection = (tabId: string, sectionId: string) => {
    setActiveTabId(tabId);
    setQuery('');
    requestAnimationFrame(() => {
      document
        .getElementById(`settings-section-${sectionId}`)
        ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  };

  return (
    <div className="flex h-[calc(100dvh-2rem)] max-h-[45rem]">
      <DialogTitle className="sr-only">{t('Settings')}</DialogTitle>
      <aside className="flex w-[200px] shrink-0 flex-col border-r bg-muted/30">
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Search')}
              className="h-8 pl-7 text-sm"
            />
            {query.trim().length > 0 && (
              <div className="absolute left-0 top-full z-20 mt-1 w-[300px] max-w-[calc(100vw-3rem)] rounded-lg border bg-popover p-1.5 shadow-md">
                {results.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {t('No results')}
                  </div>
                ) : (
                  results.map(({ tab, section }) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={`${tab.id}-${section.id}`}
                        type="button"
                        onClick={() => goToSection(tab.id, section.id)}
                        className="flex w-full rounded-md px-2 py-1.5 text-left hover:bg-accent"
                      >
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="flex items-center gap-2">
                            <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate text-sm">
                              {t(tab.label)}
                            </span>
                          </span>
                          <span className="truncate pl-7 text-xs text-muted-foreground">
                            {highlightMatch(t(section.label), query)}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
        <nav className="px-2 pb-3 pt-3">
          <div className="px-2 pb-1 text-[11px] font-medium text-muted-foreground">
            {t('Settings')}
          </div>
          <div className="space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    activeTabId === tab.id
                      ? 'bg-muted font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(tab.label)}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>
      <ScrollArea className="flex-1">
        <div className="space-y-10 px-6 pb-8 pt-[68px]">
          {activeTab.sections.map((section) => (
            <section key={section.id} id={`settings-section-${section.id}`}>
              {section.render()}
            </section>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function SettingsHubDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1000px] w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0">
        <SettingsHubContent key={open ? 'open' : 'closed'} />
      </DialogContent>
    </Dialog>
  );
}
