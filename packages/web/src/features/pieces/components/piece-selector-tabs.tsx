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
        className={`h-full group-data-horizontal/tabs:h-auto w-full flex gap-3 px-2 py-1.5 justify-start rounded-none bg-transparent overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]`}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            className={`flex flex-col h-full rounded-md w-[85px] max-w-[85px] shrink-0 px-1 py-1.5
              hover:bg-gray-4
               group-data-[variant=default]/tabs-list:data-active:text-accent-11 group-data-[variant=default]/tabs-list:data-active:shadow-none
               group-data-[variant=default]/tabs-list:data-active:bg-transparent
               text-gray-12 [&>svg]:size-5 [&>svg]:shrink-0`}
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
