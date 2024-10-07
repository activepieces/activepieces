import { PlusCircledIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Separator } from './seperator';

type DataTableInputPopoverProps = {
  title?: string;
  handleFilterChange: (filterValue: string) => void;
  intialValue:string
};

const DataTableInputPopover = ({
  title,
  handleFilterChange,
  intialValue
}: DataTableInputPopoverProps) => {
  
  const [searchQuery, setSearchQuery] = useState(intialValue);
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  useEffect(() => {
    handleFilterChange(debouncedQuery);
  }, [debouncedQuery]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircledIcon className="mr-2 size-4" />
          {title}
          {searchQuery.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal max-w-40 truncate"
              >
                {searchQuery}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Input
          type="text"
          placeholder="Name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </PopoverContent>
    </Popover>
  );
};

export { DataTableInputPopover };
