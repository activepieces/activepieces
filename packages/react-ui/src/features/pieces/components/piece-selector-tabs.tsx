import { Tabs, TabsTrigger, TabsList } from '@/components/ui/tabs';

import {
  PieceSelectorTabType,
  usePieceSelectorTabs,
} from '../lib/piece-selector-tabs-provider';

type TabType = {
  value: PieceSelectorTabType;
  name: string;
  icon: JSX.Element;
};

export const PieceSelectorTabs = ({ tabs }: { tabs: TabType[] }) => {
  const { selectedTab, setSelectedTab } = usePieceSelectorTabs();
  return (
    <Tabs
      value={selectedTab}
      onValueChange={(value) => setSelectedTab(value as PieceSelectorTabType)}
      className="w-full"
    >
      <TabsList className="h-12 w-full flex items-center gap-1 p-0 bg-white dark:bg-zinc-950 justify-start rounded-none border-b border-zinc-100 dark:border-zinc-800">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={`flex flex-row items-center gap-2 rounded-none bg-transparent h-full px-6 transition-all
               data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-50 data-[state=active]:shadow-none
               border-b-2 border-transparent data-[state=active]:border-zinc-900 dark:data-[state=active]:border-zinc-50
               text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300
               [&>svg]:size-[18px] [&>svg]:shrink-0`}
          >
            {tab.icon}
            <span className="text-[15px] font-bold tracking-tight whitespace-nowrap">{tab.name}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
