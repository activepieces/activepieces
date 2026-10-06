import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import { PieceIcon } from '@/features/pieces';
import { cn } from '@/lib/utils';

export function PieceSelect({
  pieces,
  value,
  loading,
  onChange,
}: {
  pieces: PieceMetadataModelSummary[];
  value: string | null;
  loading: boolean;
  onChange: (pieceName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [popoverContainer, setPopoverContainer] =
    useState<HTMLDivElement | null>(null);
  const selectedPiece = pieces.find((piece) => piece.name === value);
  const matchingPieces = pieces.filter((piece) =>
    piece.displayName.toLowerCase().includes(search.toLowerCase()),
  );
  const listHeight = Math.min(
    matchingPieces.length * ITEM_HEIGHT,
    MAX_LIST_HEIGHT,
  );

  return (
    <div ref={setPopoverContainer}>
      <Popover
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          setSearch('');
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={loading}
            className="w-full justify-start gap-2 font-normal"
          >
            {selectedPiece ? (
              <>
                <PieceIcon
                  size="xs"
                  border={true}
                  displayName={selectedPiece.displayName}
                  logoUrl={selectedPiece.logoUrl}
                  showTooltip={false}
                />
                <span className="flex-1 truncate text-left">
                  {selectedPiece.displayName}
                </span>
              </>
            ) : (
              <span className="flex-1 text-left text-gray-11">
                {t('Select a piece')}
              </span>
            )}
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          container={popoverContainer}
          className="w-[var(--radix-popover-trigger-width)] p-0"
        >
          <div className="border-b p-2">
            <Input
              autoFocus
              value={search}
              placeholder={t('Search pieces')}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {matchingPieces.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-11">
              {t('No pieces found')}
            </div>
          ) : (
            <div style={{ height: listHeight }}>
              <VirtualizedScrollArea
                items={matchingPieces}
                estimateSize={() => ITEM_HEIGHT}
                getItemKey={(index) => matchingPieces[index].name}
                overscan={10}
                renderItem={(piece) => (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(piece.name);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex h-full w-full items-center gap-2 px-3 text-sm hover:bg-gray-4',
                      piece.name === value && 'bg-gray-4',
                    )}
                  >
                    <PieceIcon
                      size="xs"
                      border={true}
                      displayName={piece.displayName}
                      logoUrl={piece.logoUrl}
                      showTooltip={false}
                    />
                    <span className="flex-1 truncate text-left">
                      {piece.displayName}
                    </span>
                    <Check
                      className={cn(
                        'size-4 shrink-0',
                        piece.name === value ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </button>
                )}
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

const ITEM_HEIGHT = 36;
const MAX_LIST_HEIGHT = 288;
