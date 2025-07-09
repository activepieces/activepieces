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
  const { resetToBeforeNoneWasSelected: resetToPreviousValue, setSelectedTab } =
    usePieceSelectorTabs();
  return (
    <div className="p-2">
      <SearchInput
        placeholder="Search"
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
