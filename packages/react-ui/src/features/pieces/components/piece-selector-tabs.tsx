import { t } from 'i18next';
import {
  LayoutGridIcon,
  PuzzleIcon,
  SparklesIcon,
  WrenchIcon,
} from 'lucide-react';

import { Tabs, TabsTrigger, TabsList } from '@/components/ui/tabs';

import {
  PieceSelectorTabType,
  usePieceSelectorTabs,
} from '../lib/piece-selector-tabs-provider';

export const PieceSelectorTabs = () => {
  const { selectedTab, setSelectedTab } = usePieceSelectorTabs();
  return (
    <Tabs
      value={selectedTab}
      onValueChange={(value) => setSelectedTab(value as PieceSelectorTabType)}
      className="max-w-xs w-full"
    >
      <TabsList className="h-14 w-full grid grid-cols-4 p-0 bg-background justify-start rounded-none">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={`flex flex-col rounded-none bg-background h-full
               data-[state=active]:text-accent-foreground data-[state=active]:shadow-none
               border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:active  data-[state=active]:text-primary   [&>svg]:size-5  [&>svg]:shrink-0`}
          >
            {tab.icon}
            <span className="mt-1.5 text-[13px]">{tab.name}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

const tabs = [
  {
    value: PieceSelectorTabType.EXPLORE,
    name: t('Explore'),
    icon: <LayoutGridIcon className="size-5 " />,
  },
  {
    value: PieceSelectorTabType.AI_AND_AGENTS,
    name: t('AI & Agents'),
    icon: <SparklesIcon className="size-5" />,
  },
  {
    value: PieceSelectorTabType.APPS,
    name: t('Apps'),
    icon: <PuzzleIcon className="size-5" />,
  },
  {
    value: PieceSelectorTabType.UTILITY,
    name: t('Utility'),
    icon: <WrenchIcon className="size-5" />,
  },
];
