import { Column } from '@tanstack/react-table';
import * as React from 'react';
import { DateRange } from 'react-day-picker';
import { useSearchParams } from 'react-router-dom';

import {
  DateTimePickerWithRange,
  PresetKey,
} from '@/components/custom/date-time-picker-range';

import { DataTableInputCheckbox } from './data-table-checkbox-filter';
import { DataTableInputPopover } from './data-table-input-popover';
import { DataTableSelectPopover } from './data-table-select-popover';

import { CURSOR_QUERY_PARAM } from '.';

type DropdownFilterProps = {
  type: 'select';
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }> | string;
  }[];
};

type InputFilterProps = {
  type: 'input';
};
type DateFilterProps = {
  type: 'date';
  defaultPresetName?: PresetKey;
};
type CheckboxjhFilterProps = {
  type: 'checkbox';
};

export type DataTableFilterProps = {
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
} & (
  | DropdownFilterProps
  | InputFilterProps
  | DateFilterProps
  | CheckboxjhFilterProps
);

export function DataTableFilter<TData, TValue>({
  title,
  column,
  accessorKey,
  ...props
}: DataTableFilterProps & {
  column?: Column<TData, TValue>;
  accessorKey?: string;
}) {
  const facets = column?.getFacetedUniqueValues();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramKey = accessorKey ?? column?.id;

  const handleFilterChange = React.useCallback(
    (filterValue: string | string[] | DateRange | undefined) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.delete(paramKey as string);
          newParams.delete(`${paramKey}After`);
          newParams.delete(`${paramKey}Before`);
          newParams.delete(CURSOR_QUERY_PARAM);
          if (!filterValue) {
            return newParams;
          }

          if (Array.isArray(filterValue)) {
            filterValue.forEach((value) =>
              newParams.append(paramKey as string, value),
            );
          } else if (typeof filterValue === 'object' && filterValue !== null) {
            if (filterValue.from) {
              newParams.append(
                `${paramKey}After`,
                filterValue.from.toISOString(),
              );
            }
            if (filterValue.to) {
              newParams.append(
                `${paramKey}Before`,
                filterValue.to.toISOString(),
              );
            }
          } else {
            newParams.append(paramKey as string, filterValue);
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
    [paramKey, column, setSearchParams],
  );

  switch (props.type) {
    case 'input': {
      const filterValue = searchParams.get(paramKey as string) || '';
      return (
        <DataTableInputPopover
          title={title}
          filterValue={filterValue}
          handleFilterChange={handleFilterChange}
        />
      );
    }
    case 'select': {
      const filterValue = searchParams.getAll(paramKey as string) as string[];
      const selectedValues = new Set(filterValue);
      return (
        <DataTableSelectPopover
          title={title}
          selectedValues={selectedValues}
          options={props.options}
          handleFilterChange={handleFilterChange}
          facets={facets}
        />
      );
    }
    case 'date': {
      const from = searchParams.get(`${paramKey}After`);
      const to = searchParams.get(`${paramKey}Before`);

      return (
        <DateTimePickerWithRange
          defaultSelectedRange={props.defaultPresetName}
          presetType="past"
          onChange={handleFilterChange}
          from={from ?? undefined}
          to={to ?? undefined}
        />
      );
    }
    case 'checkbox': {
      const key = paramKey || 'archivedAt';
      const isArchived = searchParams.get(key) === 'true';

      const handleCheckedChange = (checked: boolean) => {
        setSearchParams(
          (prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.delete(key);
            newParams.delete(CURSOR_QUERY_PARAM);
            if (checked) {
              newParams.append(key, 'true');
            }
            return newParams;
          },
          { replace: true },
        );

        column?.setFilterValue(
          checked
            ? (row: any) => row.getValue('archivedAt') !== null
            : undefined,
        );
      };

      return (
        <DataTableInputCheckbox
          label={title ?? 'Archived'}
          checked={isArchived}
          handleCheckedChange={handleCheckedChange}
        />
      );
    }
  }
}
