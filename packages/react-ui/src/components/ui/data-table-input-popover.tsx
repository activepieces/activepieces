import { PlusCircledIcon } from '@radix-ui/react-icons';

import { Badge } from './badge';
import { Button } from './button';
import { DebouncedInput } from './debounced-input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Separator } from './seperator';

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
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircledIcon className="mr-2 size-4" />
          {title}
          {filterValue.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal max-w-40 truncate"
              >
                {filterValue}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <DebouncedInput
          placeholder="Name"
          value={filterValue}
          onChange={handleFilterChange}
        />
      </PopoverContent>
    </Popover>
  );
};

export { DataTableInputPopover };
