import { createContext, useContext, useState } from 'react';

import { StepMetadataWithSuggestions } from '@/lib/types';

export enum PieceSelectorTabType {
  EXPLORE = 'EXPLORE',
  AI_AND_AGENTS = 'AI_AND_AGENTS',
  APPS = 'APPS',
  UTILITY = 'UTILITY',
  NONE = 'NONE',
}

export const PieceSelectorTabsContext = createContext({
  selectedTab: PieceSelectorTabType.EXPLORE,
  setSelectedTab: (tab: PieceSelectorTabType) => {},
  resetToBeforeNoneWasSelected: () => {},
  setSelectedPieceInExplore: (piece: StepMetadataWithSuggestions | null) => {},
  selectedPieceInExplore: null as null | StepMetadataWithSuggestions,
});

export const PieceSelectorTabsProvider = ({
  children,
  onTabChange,
  initiallySelectedTab,
}: {
  children: React.ReactNode;
  onTabChange: (tab: PieceSelectorTabType) => void;
  initiallySelectedTab: PieceSelectorTabType;
}) => {
  const [selectedTab, setSelectedTab] = useState(initiallySelectedTab);
  const [lastTabBefroeNoneWasSelected, setLastTabBeforeNoneWasSelected] =
    useState(initiallySelectedTab);
  const [selectedPieceInExplore, setSelectedPieceInExplore] =
    useState<StepMetadataWithSuggestions | null>(null);
  return (
    <PieceSelectorTabsContext.Provider
      value={{
        selectedTab,
        setSelectedPieceInExplore,
        selectedPieceInExplore,
        setSelectedTab: (tab: PieceSelectorTabType) => {
          if (tab !== PieceSelectorTabType.NONE) {
            setLastTabBeforeNoneWasSelected(tab);
            onTabChange(tab);
          }
          setSelectedTab(tab);
        },
        resetToBeforeNoneWasSelected: () => {
          setSelectedTab(lastTabBefroeNoneWasSelected);
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
