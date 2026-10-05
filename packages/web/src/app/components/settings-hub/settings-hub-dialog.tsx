import { t } from 'i18next';
import { Briefcase, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  DialogNav,
  DialogNavGroup,
  DialogNavItem,
} from '@/components/custom/dialog-nav';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      <span className="text-accent-11">{text.slice(idx, idx + q.length)}</span>
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
      <DialogNav>
        <div className="relative">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Search')}
            />
          </InputGroup>
          {query.trim().length > 0 && (
            <div className="absolute top-full left-0 z-20 mt-1 w-80 max-w-[calc(100vw-3rem)] rounded-2xl bg-panel p-1 shadow-over">
              {results.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-gray-11">
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
                      className="flex w-full flex-col rounded-xl px-2 py-1.5 text-left hover:bg-gray-3"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="size-4 shrink-0 text-gray-11" />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {t(tab.label)}
                        </span>
                      </span>
                      <span className="truncate pl-6 text-xs text-gray-11">
                        {highlightMatch(t(section.label), query)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
        <DialogNavGroup label={t('Settings')}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <DialogNavItem
                key={tab.id}
                active={activeTabId === tab.id}
                onClick={() => setActiveTabId(tab.id)}
              >
                <Icon />
                <span>{t(tab.label)}</span>
              </DialogNavItem>
            );
          })}
        </DialogNavGroup>
      </DialogNav>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-8 px-5 pt-14 pb-5">
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
      <DialogContent size="xl" className="gap-0 overflow-hidden p-0">
        <SettingsHubContent key={open ? 'open' : 'closed'} />
      </DialogContent>
    </Dialog>
  );
}
