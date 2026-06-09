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
          <SearchIcon className="mr-2 size-4" />
          {title}
          {filterValue.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="accent"
                className="rounded-sm px-1 font-normal max-w-40 truncate"
              >
                {filterValue}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
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
