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
      <TabsList
        className={`h-14 flex p-0 bg-background justify-start rounded-none`}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={`flex flex-row items-center justify-start gap-1 rounded-none bg-background h-full min-w-0
               data-[state=active]:text-accent-foreground data-[state=active]:shadow-none
               border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:active  data-[state=active]:text-primary   [&>svg]:size-5  [&>svg]:shrink-0`}
          >
            {tab.icon}
            <span className="text-[13px] whitespace-nowrap truncate">
              {tab.name}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
