import { t } from 'i18next';
import { SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { SearchInput } from '@/components/custom/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

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
  const [searchQuery, setSearchQuery] = useState(filterValue);
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  useEffect(() => {
    handleFilterChange(debouncedQuery);
  }, [debouncedQuery]);

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
        <SearchInput
          placeholder={t('Search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e)}
        />
      </PopoverContent>
    </Popover>
  );
};

export { DataTableInputPopover };
