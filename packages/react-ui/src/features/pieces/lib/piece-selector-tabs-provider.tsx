import { createContext, useContext, useState } from 'react';

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
  return (
    <PieceSelectorTabsContext.Provider
      value={{
        selectedTab,
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
