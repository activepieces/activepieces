import { t } from 'i18next';
import { ListFilter, Plus } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Field, FilterOperator } from '@activepieces/shared';

import { FilterRow } from './filter-row';

type FiltersPopupProps = {
  fields: Field[];
};

export function FiltersPopup({ fields }: FiltersPopupProps) {
  const [open, setOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<
    { fieldId: string; operator: FilterOperator; value: string }[]
  >(() => {
    const filtersFromParams = searchParams.getAll('filter').map((f) => {
      const [fieldId, operator, value] = f.split(':');
      return {
        fieldId,
        operator: operator as FilterOperator,
        value: decodeURIComponent(value),
      };
    });
    return filtersFromParams.length > 0
      ? filtersFromParams
      : [{ fieldId: '', operator: FilterOperator.EQ, value: '' }];
  });

  const initializedFilters = filters.filter((f) => f.fieldId && f.value);

  const handleAddFilter = () => {
    setFilters([
      ...filters,
      { fieldId: '', operator: FilterOperator.EQ, value: '' },
    ]);
  };

  const handleDeleteFilter = (index: number) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
  };

  const handleFilterChange = (
    index: number,
    fieldId: string,
    operator: FilterOperator,
    value: string,
  ) => {
    const newFilters = [...filters];
    newFilters[index] = { fieldId, operator, value };
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    const validFilters = filters.filter((f) => f.fieldId && f.value);
    setFilters(validFilters);

    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('filter');
    validFilters.forEach((f) => {
      newSearchParams.append(
        'filter',
        `${f.fieldId}:${f.operator}:${encodeURIComponent(f.value)}`,
      );
    });
    setSearchParams(newSearchParams);

    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <ListFilter className="mr-2 h-4 w-4" />
          {t('Filters')}
          {initializedFilters.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal"
              >
                {initializedFilters.length}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-4" align="start">
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {filters.map((filter, index) => (
              <FilterRow
                key={index}
                fields={fields}
                filter={filter}
                onDelete={() => handleDeleteFilter(index)}
                onChange={(fieldId, operator, value) =>
                  handleFilterChange(index, fieldId, operator, value)
                }
              />
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={handleAddFilter}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('Add Filter')}
          </Button>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setFilters([
                  { fieldId: '', operator: FilterOperator.EQ, value: '' },
                ]);
                const newSearchParams = new URLSearchParams(searchParams);
                newSearchParams.delete('filter');
                setSearchParams(newSearchParams);
                setOpen(false);
              }}
            >
              {t('Clear')}
            </Button>
            <Button onClick={handleApplyFilters}>
              <ListFilter className="mr-2 h-4 w-4" />
              {t('Apply Filters')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
