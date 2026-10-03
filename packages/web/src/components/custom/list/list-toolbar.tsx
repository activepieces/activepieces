import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';

import { Toolbar } from '@/components/custom/page';
import { SearchInput } from '@/components/custom/search-input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { listFormat } from './list-format';
import { writeParam } from './use-url-param';

function ListToolbar({
  search,
  tabs,
  filters,
  className,
}: {
  search?: React.ReactNode;
  tabs?: React.ReactNode;
  filters?: React.ReactNode;
  className?: string;
}) {
  return (
    <Toolbar data-slot="list-toolbar" className={cn('gap-2', className)}>
      {search && <div className="w-full min-w-56 sm:w-72">{search}</div>}
      {tabs}
      {filters && (
        <div className="flex flex-wrap items-center gap-2">{filters}</div>
      )}
    </Toolbar>
  );
}

function ListSearch({
  placeholder,
  param = 'search',
  value,
  onChange,
}: ListSearchProps) {
  if (onChange !== undefined) {
    return (
      <SearchInput
        value={value ?? ''}
        placeholder={placeholder}
        onChange={onChange}
      />
    );
  }
  return <UrlSearch param={param} placeholder={placeholder} />;
}

function UrlSearch({
  param,
  placeholder,
}: {
  param: string;
  placeholder: string;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState(searchParams.get(param) ?? '');
  const commit = useDebouncedCallback((next: string) => {
    setSearchParams((prev) => writeParam({ prev, key: param, value: next }), {
      replace: true,
    });
  }, 300);
  return (
    <SearchInput
      value={draft}
      placeholder={placeholder}
      onChange={(next) => {
        setDraft(next);
        commit(next);
      }}
    />
  );
}

function CountTabs<T extends string>({
  value,
  onValueChange,
  options,
  className,
}: {
  value: T;
  onValueChange: (next: T) => void;
  options: CountTabOption<T>[];
  className?: string;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        const match = options.find((option) => option.value === next);
        if (match) {
          onValueChange(match.value);
        }
      }}
      className={className}
    >
      <TabsList>
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
            {option.count !== undefined && (
              <span className="text-gray-11 tabular-nums">
                {listFormat.count(option.count)}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export { ListToolbar, ListSearch, CountTabs };

export type CountTabOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

type ListSearchProps = {
  placeholder: string;
  param?: string;
  value?: string;
  onChange?: (next: string) => void;
};
