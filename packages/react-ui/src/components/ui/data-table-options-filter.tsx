import * as React from 'react';
import { DateRange } from 'react-day-picker';
import { useSearchParams } from 'react-router-dom';

import { DataTableInputPopover } from './data-table-input-popover';
import { DataTableSelectPopover } from './data-table-select-popover';
import { DatePickerWithRange } from './date-picker-range';
import { Column } from '@tanstack/react-table';

type CommonFilterProps<TData, TValue> = {
   title: string;
   accessorKey: string
   column?: Column<TData, TValue>
}

type  SelectFilterProps<TData, TValue> = CommonFilterProps<TData, TValue> & {
    type: 'select';
  options: readonly {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

type DateOrInputFilterProps<TData, TValue> = CommonFilterProps<TData, TValue> & {
  type: 'date' | 'input'
}

export type DataTableFacetedFilterProps<TData, TValue> = DateOrInputFilterProps<TData, TValue> | SelectFilterProps<TData, TValue>

export function DataTableFacetedFilter<TData, TValue>(props: DataTableFacetedFilterProps<TData, TValue>) {

  const [searchParams, setSearchParams] = useSearchParams();
  const handleFilterChange = React.useCallback(
    (filterValue: string | string[] | DateRange | undefined) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.delete(props.accessorKey);
          newParams.delete(`${props.accessorKey}After`);
          newParams.delete(`${props.accessorKey}Before`);

          if (!filterValue) {
            return newParams;
          }

          if (Array.isArray(filterValue)) {
            filterValue.forEach((value) =>
              newParams.append(props.accessorKey as string, value),
            );
          } else if (typeof filterValue === 'object' && filterValue !== null) {
            if (filterValue.from) {
              newParams.append(
                `${props.accessorKey}After`,
                filterValue.from.toISOString(),
              );
            }
            if (filterValue.to) {
              newParams.append(
                `${props.accessorKey}Before`,
                filterValue.to.toISOString(),
              );
            }
          } else {
            newParams.append(props.accessorKey, filterValue);
          }

          return newParams;
        },
        { replace: true },
      );

     
    },
    [setSearchParams],
  );

  switch (props.type) {
    case 'input': {
      const intialValue = searchParams.get(props.accessorKey)?? '';
      return (
        <DataTableInputPopover
          title={props.title}
          handleFilterChange={handleFilterChange}
          intialValue={intialValue}
        />
      );
    }
    case 'select': {

      const intialValue = searchParams.getAll(props.accessorKey)
      return (
        <DataTableSelectPopover
          title={props.title}
          options={props.options}
          handleFilterChange={handleFilterChange}
          initialValues={intialValue}
        />
      );
    }
    case 'date': {
      const from = searchParams.get(`${props.accessorKey}After`);
      const to = searchParams.get(`${props.accessorKey}Before`);

      return (
        <DatePickerWithRange
          presetType="past"
          onChange={handleFilterChange}
          from={from ?? undefined}
          to={to ?? undefined}
        />
      );
    }
  }
}
