import { t } from 'i18next';
import { ArrowLeftIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { usePieceSearchContext } from '@/features/pieces/lib/piece-search-context';
import {
  PieceSelectorTabType,
  usePieceSelectorTabs,
} from '@/features/pieces/lib/piece-selector-tabs-provider';

import { SearchInput } from '../../../components/ui/search-input';

type PiecesSearchInputProps = {
  searchInputRef: React.RefObject<HTMLInputElement>;
  onSearchChange: (query: string) => void;
};

const PiecesSearchInput = ({
  searchInputRef,
  onSearchChange,
}: PiecesSearchInputProps) => {
  const { searchQuery, setSearchQuery } = usePieceSearchContext();
  const {
    resetToBeforeNoneWasSelected: resetToPreviousValue,
    setSelectedTab,
    selectedPieceInExplore,
    selectedTab,
    setSelectedPieceInExplore,
  } = usePieceSelectorTabs();
  const showBackButton =
    selectedPieceInExplore && selectedTab === PieceSelectorTabType.EXPLORE;
  return (
    <div className="px-4 py-2.5 flex gap-2 items-center border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => {
            setSelectedPieceInExplore(null);
          }}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
      )}
      <SearchInput
        placeholder={t('Search')}
        value={searchQuery}
        ref={searchInputRef}
        onChange={(e) => {
          setSearchQuery(e);
          onSearchChange(e);
          if (e === '') {
            resetToPreviousValue();
          } else {
            setSelectedTab(PieceSelectorTabType.NONE);
          }
        }}
      />
    </div>
  );
};
PiecesSearchInput.displayName = 'PiecesSearchInput';
export { PiecesSearchInput };
