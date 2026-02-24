import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';

import { AutomationsFilters } from '../lib/types';
import { hasActiveFilters } from '../lib/utils';

const SEARCH_PARAM = 'search';
const TYPE_PARAM = 'type';
const STATUS_PARAM = 'status';
const CONNECTION_PARAM = 'connection';
const OWNER_PARAM = 'owner';
const FOLDER_PARAM = 'folder';

const FILTER_PARAMS = [
  SEARCH_PARAM,
  TYPE_PARAM,
  STATUS_PARAM,
  CONNECTION_PARAM,
  OWNER_PARAM,
  FOLDER_PARAM,
] as const;

export function useAutomationsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState(
    () => searchParams.get(SEARCH_PARAM) ?? '',
  );
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get(SEARCH_PARAM) ?? '',
  );
  const [typeFilter, setTypeFilterState] = useState<string[]>(
    () => searchParams.getAll(TYPE_PARAM),
  );
  const [statusFilter, setStatusFilterState] = useState<string[]>(
    () => searchParams.getAll(STATUS_PARAM),
  );
  const [connectionFilter, setConnectionFilterState] = useState<string[]>(
    () => searchParams.getAll(CONNECTION_PARAM),
  );
  const [ownerFilter, setOwnerFilterState] = useState<string[]>(
    () => searchParams.getAll(OWNER_PARAM),
  );
  const [folderFilter, setFolderFilterState] = useState<string[]>(
    () => searchParams.getAll(FOLDER_PARAM),
  );

  const updateParams = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(updates)) {
            next.delete(key);
            if (value === null || value === '') continue;
            if (Array.isArray(value)) {
              value.forEach((v) => next.append(key, v));
            } else {
              next.set(key, value);
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
    updateParams({ [SEARCH_PARAM]: value || null });
  }, 300);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      debouncedSetSearch(value);
    },
    [debouncedSetSearch],
  );

  const setTypeFilter = useCallback(
    (value: string[]) => {
      setTypeFilterState(value);
      updateParams({ [TYPE_PARAM]: value.length > 0 ? value : null });
    },
    [updateParams],
  );

  const setStatusFilter = useCallback(
    (value: string[]) => {
      setStatusFilterState(value);
      updateParams({ [STATUS_PARAM]: value.length > 0 ? value : null });
    },
    [updateParams],
  );

  const setConnectionFilter = useCallback(
    (value: string[]) => {
      setConnectionFilterState(value);
      updateParams({ [CONNECTION_PARAM]: value.length > 0 ? value : null });
    },
    [updateParams],
  );

  const setOwnerFilter = useCallback(
    (value: string[]) => {
      setOwnerFilterState(value);
      updateParams({ [OWNER_PARAM]: value.length > 0 ? value : null });
    },
    [updateParams],
  );

  const setFolderFilter = useCallback(
    (value: string[]) => {
      setFolderFilterState(value);
      updateParams({ [FOLDER_PARAM]: value.length > 0 ? value : null });
    },
    [updateParams],
  );

  const filters: AutomationsFilters = {
    searchTerm,
    typeFilter,
    statusFilter,
    connectionFilter,
    ownerFilter,
    folderFilter,
  };

  const filtersActive = hasActiveFilters(filters);

  const clearAllFilters = useCallback(() => {
    setSearchInput('');
    setSearchTerm('');
    setTypeFilterState([]);
    setStatusFilterState([]);
    setConnectionFilterState([]);
    setOwnerFilterState([]);
    setFolderFilterState([]);
    updateParams(
      Object.fromEntries(FILTER_PARAMS.map((key) => [key, null])),
    );
  }, [updateParams]);

  return {
    searchInput,
    handleSearchChange,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    connectionFilter,
    setConnectionFilter,
    ownerFilter,
    setOwnerFilter,
    folderFilter,
    setFolderFilter,
    filters,
    filtersActive,
    clearAllFilters,
  };
}
