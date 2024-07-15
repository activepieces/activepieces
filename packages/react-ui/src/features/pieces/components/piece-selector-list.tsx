import { useDebounce } from 'use-debounce';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/spinner';

import { piecesHooks } from '../lib/pieces-hook';

import { PieceCardInfo } from './piece-card-info';

const PieceSelectorList = () => {
  const [searchQuery, setSearchQuery] = useDebounce<string>('', 300);
  const { data: pieces, isLoading } = piecesHooks.usePieces({
    searchQuery,
  });

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="text-lg font-semibold">Select Step</div>
      <div className="w-full">
        <Input
          type="text"
          placeholder="Search for a piece"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {isLoading && (
        <div className="flex h-full grow items-center justify-center text-center">
          <LoadingSpinner />
        </div>
      )}
      {pieces && pieces.length === 0 && (
        <div className="flex h-full grow items-center justify-center text-center">
          No pieces found
        </div>
      )}
      {!isLoading && pieces && pieces.length > 0 && (
        <ScrollArea>
          <div className="flex h-max flex-col gap-4">
            {pieces &&
              pieces.map((piece) => (
                <PieceCardInfo piece={piece} key={piece.name} />
              ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export { PieceSelectorList };
