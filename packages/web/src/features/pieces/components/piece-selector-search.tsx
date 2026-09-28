import { ArrowLeft02Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import { usePieceSearchContext } from '@/features/pieces/stores/piece-search-context';
import {
  PieceSelectorTabType,
  usePieceSelectorTabs,
} from '@/features/pieces/stores/piece-selector-tabs-provider';

type PiecesSearchInputProps = {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
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
    <div className="p-2 flex gap-2 items-center">
      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSelectedPieceInExplore(null);
          }}
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
        </Button>
      )}
      <SearchInput
        placeholder={t('Search')}
        value={searchQuery}
        data-testid="pieces-search-input"
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
