import { Tabs, TabsTrigger, TabsList } from '@/components/ui/tabs';

import {
  PieceSelectorTabType,
  usePieceSelectorTabs,
} from '../stores/piece-selector-tabs-provider';
import { ResolvedPieceSelectorTab } from '../utils/piece-selector-customization';

export const PieceSelectorTabs = ({
  tabs,
}: {
  tabs: ResolvedPieceSelectorTab[];
}) => {
  const { selectedTab, selectedCustomTabId, setSelectedTab } =
    usePieceSelectorTabs();
  const selectedTabKey =
    selectedTab === PieceSelectorTabType.CUSTOM
      ? selectedCustomTabId ?? ''
      : selectedTab;
  return (
    <Tabs
      value={selectedTabKey}
      onValueChange={(value) => {
        const tab = tabs.find((candidate) => candidate.key === value);
        if (tab) {
          setSelectedTab(tab.type, tab.customTabId ?? null);
        }
      }}
      className="w-full min-w-0"
    >
      <TabsList
        className={`h-full w-full flex gap-3 px-2 justify-start rounded-none bg-background overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]`}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            className={`flex flex-col h-full rounded-md w-[85px] max-w-[85px] shrink-0
              hover:bg-gray-300/30 dark:hover:bg-gray-300/10
               data-[state=active]:text-primary data-[state=active]:shadow-none
               border-transparent data-[state=active]:border-primary data-[state=active]:active data-[state=active]:bg-transparent
               text-accent-foreground [&>svg]:size-5 [&>svg]:shrink-0`}
          >
            {tab.icon}
            <span className="mt-1.5 text-sm truncate w-full text-center">
              {tab.name}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
