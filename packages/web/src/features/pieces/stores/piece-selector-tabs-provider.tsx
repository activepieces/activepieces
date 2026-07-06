import { createContext, useContext, useState } from 'react';

import { StepMetadataWithSuggestions } from '@/features/pieces/types';

export enum PieceSelectorTabType {
  EXPLORE = 'EXPLORE',
  AI_AND_AGENTS = 'AI_AND_AGENTS',
  APPROVALS = 'APPROVALS',
  APPS = 'APPS',
  UTILITY = 'UTILITY',
  CUSTOM = 'CUSTOM',
  NONE = 'NONE',
}

export const PieceSelectorTabsContext = createContext({
  selectedTab: PieceSelectorTabType.EXPLORE,
  selectedCustomTabId: null as string | null,
  setSelectedTab: (
    _tab: PieceSelectorTabType,
    _customTabId?: string | null,
  ) => {},
  resetToBeforeNoneWasSelected: () => {},
  setSelectedPieceInExplore: (_piece: StepMetadataWithSuggestions | null) => {},
  selectedPieceInExplore: null as null | StepMetadataWithSuggestions,
});

export const PieceSelectorTabsProvider = ({
  children,
  onTabChange,
  initiallySelectedTab,
  initiallySelectedCustomTabId = null,
}: {
  children: React.ReactNode;
  onTabChange: (tab: PieceSelectorTabType) => void;
  initiallySelectedTab: PieceSelectorTabType;
  initiallySelectedCustomTabId?: string | null;
}) => {
  const [selectedTab, setSelectedTab] = useState(initiallySelectedTab);
  const [selectedCustomTabId, setSelectedCustomTabId] = useState<string | null>(
    initiallySelectedCustomTabId,
  );
  const [lastTabBefroeNoneWasSelected, setLastTabBeforeNoneWasSelected] =
    useState<{ tab: PieceSelectorTabType; customTabId: string | null }>({
      tab: initiallySelectedTab,
      customTabId: initiallySelectedCustomTabId,
    });
  const [selectedPieceInExplore, setSelectedPieceInExplore] =
    useState<StepMetadataWithSuggestions | null>(null);
  return (
    <PieceSelectorTabsContext.Provider
      value={{
        selectedTab,
        selectedCustomTabId,
        setSelectedPieceInExplore,
        selectedPieceInExplore,
        setSelectedTab: (
          tab: PieceSelectorTabType,
          customTabId: string | null = null,
        ) => {
          if (tab !== PieceSelectorTabType.NONE) {
            setLastTabBeforeNoneWasSelected({ tab, customTabId });
            onTabChange(tab);
          }
          setSelectedTab(tab);
          setSelectedCustomTabId(customTabId);
        },
        resetToBeforeNoneWasSelected: () => {
          setSelectedTab(lastTabBefroeNoneWasSelected.tab);
          setSelectedCustomTabId(lastTabBefroeNoneWasSelected.customTabId);
        },
      }}
    >
      {children}
    </PieceSelectorTabsContext.Provider>
  );
};

export const usePieceSelectorTabs = () => {
  const context = useContext(PieceSelectorTabsContext);
  if (!context) {
    throw new Error(
      'usePieceSelectorTabs must be used within a PieceSelectorTabsProvider',
    );
  }
  return context;
};
