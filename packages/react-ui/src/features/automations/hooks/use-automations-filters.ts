import { useCallback, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { AutomationsFilters } from '../lib/types';
import { hasActiveFilters } from '../lib/utils';

export function useAutomationsFilters() {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSetSearch = useDebouncedCallback(setSearchTerm, 300);
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      debouncedSetSearch(value);
    },
    [debouncedSetSearch],
  );

  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [connectionFilter, setConnectionFilter] = useState<string[]>([]);
  const [ownerFilter, setOwnerFilter] = useState<string[]>([]);

  const filters: AutomationsFilters = {
    searchTerm,
    typeFilter,
    statusFilter,
    connectionFilter,
    ownerFilter,
  };

  const filtersActive = hasActiveFilters(filters);

  const clearAllFilters = useCallback(() => {
    setSearchInput('');
    setSearchTerm('');
    setTypeFilter([]);
    setStatusFilter([]);
    setConnectionFilter([]);
    setOwnerFilter([]);
  }, []);

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
    filters,
    filtersActive,
    clearAllFilters,
  };
}
