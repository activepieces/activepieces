import { Column } from '@tanstack/react-table';
import * as React from 'react';
import { DateRange } from 'react-day-picker';
import { useSearchParams } from 'react-router-dom';

import { DateTimePickerWithRange } from '../date-time-picker-range';

import { DataTableInputPopover } from './data-table-input-popover';
import { DataTableSelectPopover } from './data-table-select-popover';

interface DataTableFacetedFilterProps<TData, TValue> {
  type: 'select' | 'input' | 'date';
  column?: Column<TData, TValue>;
  title?: string;
  options: readonly {
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
  const [searchParams, setSearchParams] = useSearchParams();

  const handleFilterChange = React.useCallback(
    (filterValue: string | string[] | DateRange | undefined) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.delete(column?.id as string);
          newParams.delete(`${column?.id}After`);
          newParams.delete(`${column?.id}Before`);
          newParams.delete('cursor');
          if (!filterValue) {
            return newParams;
          }

          if (Array.isArray(filterValue)) {
            filterValue.forEach((value) =>
              newParams.append(column?.id as string, value),
            );
          } else if (typeof filterValue === 'object' && filterValue !== null) {
            if (filterValue.from) {
              newParams.append(
                `${column?.id}After`,
                filterValue.from.toISOString(),
              );
            }
            if (filterValue.to) {
              newParams.append(
                `${column?.id}Before`,
                filterValue.to.toISOString(),
              );
            }
          } else {
            newParams.append(column?.id as string, filterValue);
          }

          return newParams;
        },
        { replace: true },
      );

      if (Array.isArray(filterValue)) {
        column?.setFilterValue(filterValue.length ? filterValue : undefined);
      } else if (typeof filterValue === 'object' && filterValue !== null) {
        column?.setFilterValue(
          filterValue.from || filterValue.to ? filterValue : undefined,
        );
      } else {
        column?.setFilterValue(filterValue ? filterValue : undefined);
      }
    },
    [column, setSearchParams],
  );

  switch (type) {
    case 'input': {
      const filterValue = searchParams.get(column?.id as string) || '';
      return (
        <DataTableInputPopover
          title={title}
          filterValue={filterValue}
          handleFilterChange={handleFilterChange}
        />
      );
    }
    case 'select': {
      const filterValue = column?.getFilterValue() as string[];
      const selectedValues = new Set(filterValue);
      return (
        <DataTableSelectPopover
          title={title}
          selectedValues={selectedValues}
          options={options}
          handleFilterChange={handleFilterChange}
          facets={facets}
        />
      );
    }
    case 'date': {
      const from = searchParams.get(`${column?.id}After`);
      const to = searchParams.get(`${column?.id}Before`);

      return (
        <DateTimePickerWithRange
          presetType="past"
          onChange={handleFilterChange}
          from={from ?? undefined}
          to={to ?? undefined}
        />
      );
    }
  }
}
