import { Column } from '@tanstack/react-table';
import * as React from 'react';
import { useSearchParams } from 'react-router-dom';

import { DataTableInputPopover } from './data-table-input-popover';
import { DataTableSelectPopover } from './data-table-select-popover';

interface DataTableFacetedFilterProps<TData, TValue> {
  type: string;
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

export function DataTableFacetedFilter<TData, TValue>({
  type,
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  const [, setSearchParams] = useSearchParams();
  const selectedValues = new Set(column?.getFilterValue() as string[]);

  const handleFilterChange = React.useCallback(
    (filterValue: string | string[]) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete(column?.id as string);

        if (!filterValue) {
          return newParams;
        }

        if (Array.isArray(filterValue)) {
          filterValue.forEach((value) =>
            newParams.append(column?.id as string, value),
          );
        } else {
          newParams.append(column?.id as string, filterValue);
        }

        return newParams;
      });
      column?.setFilterValue(filterValue.length ? filterValue : undefined);
    },
    [column, setSearchParams],
  );

  switch (type) {
    case 'input': {
      const filterValue = (column?.getFilterValue() || '') as string;
      return (
        <DataTableInputPopover
          title={title}
          filterValue={filterValue}
          handleFilterChange={handleFilterChange}
        />
      );
    }
    case 'select':
      return (
        <DataTableSelectPopover
          title={title}
          selectedValues={selectedValues}
          options={options}
          handleFilterChange={handleFilterChange}
          facets={facets}
        />
      );

    default:
      return null;
  }
}
