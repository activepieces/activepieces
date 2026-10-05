import { t } from 'i18next';
import { SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { SearchInput } from '@/components/custom/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

const DEBOUNCE_MS = 500;

type DataTableInputPopoverProps = {
  title?: string;
  filterValue: string;
  handleFilterChange: (filterValue: string) => void;
};

const DataTableInputPopover = ({
  title,
  filterValue,
  handleFilterChange,
}: DataTableInputPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-dashed">
          <SearchIcon />
          {title}
          {filterValue.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Badge variant="secondary" className="max-w-40">
                <span className="truncate">{filterValue}</span>
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <SearchPopoverContent
          key={filterValue}
          filterValue={filterValue}
          handleFilterChange={handleFilterChange}
        ></SearchPopoverContent>
      </PopoverContent>
    </Popover>
  );
};

const SearchPopoverContent = ({
  filterValue,
  handleFilterChange,
}: Pick<DataTableInputPopoverProps, 'filterValue' | 'handleFilterChange'>) => {
  const [searchQuery, setSearchQuery] = useState(filterValue);
  const debouncedFilterChange = useDebouncedCallback(
    handleFilterChange,
    DEBOUNCE_MS,
  );

  const onSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedFilterChange(value);
  };

  return (
    <SearchInput
      key={filterValue}
      placeholder={t('Search')}
      value={searchQuery}
      onChange={onSearchChange}
    />
  );
};
export { DataTableInputPopover };
