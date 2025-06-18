import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PieceBlocks } from './piece-blocks';
import { SearchInput } from '@/components/ui/search-input';
import { Separator } from '@/components/ui/separator';

type PieceSelectorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asChild: boolean;
  children: React.ReactNode;
};

const PieceSelector = ({
  open,
  onOpenChange,
  asChild,
  children,
}: PieceSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Popover open={open} modal={true} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild={asChild}>{children}</PopoverTrigger>
      <PopoverContent className="w-[500px] h-[315px] mt-2 p-0">
        <div className="flex flex-col h-full">
          <div className="p-2">
            <SearchInput
              placeholder="Search"
              value={searchQuery}
              showDeselect={searchQuery.length > 0}
              onChange={(e) => {
                setSearchQuery(e);
              }}
            />
          </div>
          <Separator className="my-0" />
          <div className="flex-1 overflow-hidden">
            <PieceBlocks />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { PieceSelector };
