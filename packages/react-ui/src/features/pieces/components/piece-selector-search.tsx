import { t } from 'i18next';
import { ArrowLeftIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  PieceSelectorTabType,
  usePieceSelectorTabs,
} from '@/features/pieces/lib/piece-selector-tabs-provider';

import { SearchInput } from '../../../components/ui/search-input';

type PiecesSearchInputProps = {
  searchQuery: string;
  searchInputRef: React.RefObject<HTMLInputElement>;
  onSearchChange: (query: string) => void;
};

const PiecesSearchInput = ({
  searchQuery,
  searchInputRef,
  onSearchChange,
}: PiecesSearchInputProps) => {
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
    <div className="p-2 flex gap-2 items-center">
      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
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
