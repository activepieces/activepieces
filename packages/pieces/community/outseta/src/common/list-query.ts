import { dateRangeUtils, DateRangeValue, isNil } from '@activepieces/pieces-framework';

const WILDCARD_PATTERNS: Record<string, (value: string) => string> = {
  contains: (value) => `*${value}*`,
  starts_with: (value) => `${value}*`,
  ends_with: (value) => `*${value}`,
};

const COMPARISON_SUFFIXES: Record<string, string> = {
  gt: '__gt',
  gte: '__gte',
  lt: '__lt',
  lte: '__lte',
  ne: '__ne',
  is_null: '__isnull',
};

function isBlank(value: unknown): boolean {
  return isNil(value) || value === '';
}

function paramFor(filter: OutsetaFilter): [string, string] | null {
  if (isBlank(filter.value)) {
    return null;
  }
  const value = String(filter.value);
  const operator = filter.operator ?? 'eq';

  const wildcard = WILDCARD_PATTERNS[operator];
  if (wildcard) {
    return [filter.field, wildcard(value)];
  }

  const suffix = COMPARISON_SUFFIXES[operator];
  if (suffix) {
    return [`${filter.field}${suffix}`, value];
  }

  return [filter.field, value];
}

function build({ filters = [], orderBy, orderDirection, limit, page }: BuildQueryParams): string {
  const params = new URLSearchParams();

  for (const filter of filters) {
    const param = paramFor(filter);
    if (param) {
      params.append(param[0], param[1]);
    }
  }

  if (!isBlank(orderBy)) {
    params.append('orderBy', `${orderBy} ${orderDirection === 'desc' ? 'DESC' : 'ASC'}`);
  }
  if (!isNil(limit)) {
    params.append('limit', String(limit));
  }
  if (!isNil(page)) {
    params.append('offset', String(page));
  }

  return params.toString();
}

function dateRangeFilters({ field, range }: DateRangeFilterParams): OutsetaFilter[] {
  const { after, before } = dateRangeUtils.resolve(range);
  return [
    { field, operator: 'gte', value: after },
    { field, operator: 'lte', value: before },
  ];
}

function pageInfo({ total, limit, offset }: PageInfoParams): PageInfo {
  const hasMore =
    !isNil(total) && !isNil(limit) && !isNil(offset) && limit > 0
      ? (offset + 1) * limit < total
      : false;

  return { total: total ?? null, page: offset ?? null, has_more: hasMore };
}

export const outsetaQuery = { build, dateRangeFilters, pageInfo };

export type OutsetaFilterOperator =
  | 'eq'
  | 'ne'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'is_null';

export type OutsetaFilter = {
  field: string;
  operator?: OutsetaFilterOperator;
  value: unknown;
};

type BuildQueryParams = {
  filters?: OutsetaFilter[];
  orderBy?: string | null;
  orderDirection?: string | null;
  limit?: number | null;
  page?: number | null;
};

type PageInfoParams = {
  total: number | null;
  limit: number | null;
  offset: number | null;
};

type PageInfo = {
  total: number | null;
  page: number | null;
  has_more: boolean;
};

type DateRangeFilterParams = {
  field: string;
  range: DateRangeValue | null | undefined;
};
