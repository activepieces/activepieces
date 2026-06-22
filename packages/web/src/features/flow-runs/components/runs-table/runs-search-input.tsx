import { t } from 'i18next';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';

import { CURSOR_QUERY_PARAM } from '@/components/custom/data-table';
import { SearchInput } from '@/components/custom/search-input';

const DEBOUNCE_MS = 300;

type RunsSearchInputProps = {
  isFetching: boolean;
};

export const RunsSearchInput = ({ isFetching }: RunsSearchInputProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const committedSearch = searchParams.get(SEARCH_QUERY_PARAM) ?? '';
  const [value, setValue] = useState(committedSearch);

  const commitSearch = useDebouncedCallback((next: string) => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        const trimmed = next.trim();
        if (trimmed.length > 0) {
          newParams.set(SEARCH_QUERY_PARAM, trimmed);
        } else {
          newParams.delete(SEARCH_QUERY_PARAM);
        }
        newParams.delete(CURSOR_QUERY_PARAM);
        return newParams;
      },
      { replace: true },
    );
  }, DEBOUNCE_MS);

  const onChange = (next: string) => {
    setValue(next);
    commitSearch(next);
  };

  const isDebouncePending = value.trim() !== committedSearch;
  const loading = (isDebouncePending || isFetching) && value.trim().length > 0;

  return (
    <div className="w-[260px] shrink-0">
      <SearchInput
        placeholder={t('Search runs')}
        value={value}
        onChange={onChange}
        loading={loading}
      />
    </div>
  );
};

export const SEARCH_QUERY_PARAM = 'search';
