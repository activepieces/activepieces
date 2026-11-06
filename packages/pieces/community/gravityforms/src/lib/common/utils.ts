import type { GravityFormsSearch } from './types';

function searchQuery({
  status,
  fieldFilters,
  filterMode,
}: {
  status?: string;
  fieldFilters?: unknown;
  filterMode?: string;
}): Record<string, string> {
  const filters = Array.isArray(fieldFilters) ? fieldFilters : [];
  const search: GravityFormsSearch = {
    ...(status ? { status } : {}),
    ...(filters.length > 0 ? { field_filters: { ...filters, mode: filterMode ?? 'all' } } : {}),
  };
  return Object.keys(search).length > 0 ? { search: JSON.stringify(search) } : {};
}

export const gravityFormsUtils = { searchQuery };
