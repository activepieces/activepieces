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
      className="max-w-md w-full"
    >
      <TabsList
        className={`h-full w-full flex gap-3 px-2 bg-background justify-start rounded-none`}
        style={{
          gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
        }}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={`flex flex-col  bg-background grow  h-full rounded-md  w-[85px] max-w-[85px] shrink-0
              hover:bg-gray-300/30 dark:hover:bg-gray-300/10
               data-[state=active]:text-primary data-[state=active]:shadow-none
               border-transparent data-[state=active]:border-primary data-[state=active]:active
               text-accent-foreground [&>svg]:size-5 [&>svg]:shrink-0`}
          >
            {tab.icon}
            <span className="mt-1.5 text-sm">{tab.name}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
