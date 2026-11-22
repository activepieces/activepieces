export type QueryValue = string | number | boolean | null | undefined;

export type QueryFilter = Record<string, QueryValue>;

export function buildListQuery({
  params,
  filter,
}: {
  params?: QueryFilter;
  filter?: QueryFilter;
}): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (hasValue(value)) {
      query[key] = String(value);
    }
  }
  for (const [key, value] of Object.entries(filter ?? {})) {
    if (hasValue(value)) {
      query['filter[' + key + ']'] = String(value);
    }
  }
  return query;
}

function hasValue(value: QueryValue): value is string | number | boolean {
  if (value === null || value === undefined) {
    return false;
  }
  return typeof value !== 'string' || value.length > 0;
}

export type Paging = {
  items_per_page: number;
  current_page: number;
  count_pages: number;
  count_items: number;
};

export type ListPage<T> = {
  items: T[];
  paging?: Paging;
};
