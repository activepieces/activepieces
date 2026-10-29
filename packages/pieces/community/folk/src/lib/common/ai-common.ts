import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { folkClient, FolkAuthValue } from './client';
import { folkFields } from './fields';

function idProp({ displayName, description, required = true }: { displayName: string; description: string; required?: boolean }) {
  return required
    ? Property.ShortText({ displayName, description, required: true })
    : Property.ShortText({ displayName, description, required: false });
}

function listProp({ displayName, description }: { displayName: string; description: string }) {
  return Property.Array({ displayName, description, required: false });
}

function paginationProps() {
  return {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'How many results to return on this page (1-100). Defaults to 20.',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Next Cursor from the previous result. Empty for the first page.',
      required: false,
    }),
  };
}

function idempotencyKeyProp() {
  return Property.ShortText({
    displayName: 'Idempotency Key',
    description:
      'Optional unique key (max 255 characters). If the same request is sent again with the same key, Folk returns the first result instead of creating a duplicate. Reuse the key only when retrying the same request.',
    required: false,
  });
}

function mergedGroups({
  groupIds,
  customFieldValues,
  currentGroupIds,
}: {
  groupIds: string[] | undefined;
  customFieldValues: Record<string, unknown> | undefined;
  currentGroupIds: string[] | undefined;
}): string[] | undefined {
  const fieldGroups = customFieldValues ? Object.keys(customFieldValues) : [];
  if (groupIds === undefined && fieldGroups.length === 0) {
    return undefined;
  }
  const base = groupIds ?? currentGroupIds ?? [];
  return [...new Set([...base, ...fieldGroups])];
}

async function groupsForUpdate({
  auth,
  path,
  groupIds,
  clearGroups,
  customFieldValues,
}: {
  auth: FolkAuthValue;
  path: string;
  groupIds: string[] | undefined;
  clearGroups: boolean;
  customFieldValues: Record<string, unknown> | undefined;
}): Promise<string[] | undefined> {
  const given = clearGroups ? [] : groupIds !== undefined && groupIds.length > 0 ? groupIds : undefined;
  const currentGroupIds =
    given === undefined && customFieldValues !== undefined ? await currentGroupIdsOf({ auth, path }) : undefined;
  return mergedGroups({ groupIds: given, customFieldValues, currentGroupIds });
}

async function currentGroupIdsOf({ auth, path }: { auth: FolkAuthValue; path: string }): Promise<string[]> {
  const record = await folkClient.getData<{ groups?: { id?: unknown }[] }>({ auth, path });
  return (record.groups ?? []).map((group) => group.id).filter((id): id is string => typeof id === 'string');
}

function filterQuery({ filters, combinator }: { filters: FilterEntry[]; combinator: unknown }): Record<string, string> {
  const query = Object.fromEntries(
    filters.flatMap((filter) => {
      if (filter.value === undefined && filter.operator !== 'empty' && filter.operator !== 'not_empty') {
        return [];
      }
      const suffix = filter.subKey ? `[${filter.subKey}]` : '';
      return [[`filter[${filter.field}][${filter.operator}]${suffix}`, filter.value ?? '']];
    })
  );
  if (Object.keys(query).length > 1) {
    query['combinator'] = combinator === 'or' ? 'or' : 'and';
  }
  return query;
}

function extraFilters({ value }: { value: unknown }): FilterEntry[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  const parsed = typeof value === 'string' ? parseJsonArray({ value }) : value;
  if (!Array.isArray(parsed)) {
    throw new Error('Extra Filters must be a JSON array of {"field", "operator", "value"} objects.');
  }
  return parsed.map((entry) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error('Each Extra Filters entry must be an object with field, operator and value.');
    }
    const field: unknown = Reflect.get(entry, 'field');
    const operator: unknown = Reflect.get(entry, 'operator');
    const raw: unknown = Reflect.get(entry, 'value');
    const subKey: unknown = Reflect.get(entry, 'subKey');
    if (typeof field !== 'string' || !/^[A-Za-z0-9_.\- ]{1,200}$/.test(field)) {
      throw new Error(`Extra Filters field "${String(field)}" is not valid. Use names like "jobTitle" or "customFieldValues.grp_....Status".`);
    }
    if (typeof operator !== 'string' || !FILTER_OPERATORS.includes(operator)) {
      throw new Error(`Extra Filters operator "${String(operator)}" is not valid. Use one of: ${FILTER_OPERATORS.join(', ')}.`);
    }
    if (subKey !== undefined && subKey !== 'id' && subKey !== 'email') {
      throw new Error('Extra Filters subKey can only be "id" or "email".');
    }
    const needsValue = operator !== 'empty' && operator !== 'not_empty';
    if (needsValue && (raw === undefined || raw === null || raw === '')) {
      throw new Error(`Extra Filters entry for "${field}" needs a value for operator "${operator}".`);
    }
    return {
      field,
      operator,
      value: needsValue ? String(raw) : '',
      subKey: typeof subKey === 'string' ? subKey : undefined,
    };
  });
}

function combinatorProp() {
  return Property.StaticDropdown({
    displayName: 'Combine Filters With',
    description: 'AND (default) returns records matching every filter; OR returns records matching any filter.',
    required: false,
    options: {
      options: [
        { label: 'AND', value: 'and' },
        { label: 'OR', value: 'or' },
      ],
    },
  });
}

function extraFiltersProp({ example }: { example: string }) {
  return Property.Json({
    displayName: 'Extra Filters',
    description: `Optional extra Folk filters as a JSON array of {"field", "operator", "value", "subKey"?}. Operators: ${FILTER_OPERATORS.join(', ')}. Example: ${example}`,
    required: false,
  });
}

async function deleteRecord({ auth, path, id }: { auth: FolkAuthValue; path: string; id: string }): Promise<{ deleted: true; id: string }> {
  await folkClient.request<unknown>({ auth, method: HttpMethod.DELETE, path });
  return { deleted: true, id };
}

function parseJsonArray({ value }: { value: string }): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('Extra Filters is not valid JSON.');
  }
}

function pageResult<T>({ page }: { page: { items: T[]; count: number; hasMore: boolean; nextCursor: string | null } }) {
  return { items: page.items, count: page.count, hasMore: page.hasMore, nextCursor: page.nextCursor };
}

function paging({ propsValue }: { propsValue: { limit?: unknown; cursor?: unknown } }) {
  return {
    limit: folkFields.limitValue({ value: propsValue.limit }),
    cursor: folkFields.cursorValue({ value: propsValue.cursor }),
  };
}

const FILTER_OPERATORS = ['eq', 'not_eq', 'like', 'not_like', 'gt', 'lt', 'in', 'not_in', 'all', 'empty', 'not_empty'];

export const folkAi = {
  idProp,
  listProp,
  paginationProps,
  idempotencyKeyProp,
  combinatorProp,
  extraFiltersProp,
  mergedGroups,
  currentGroupIdsOf,
  groupsForUpdate,
  filterQuery,
  extraFilters,
  deleteRecord,
  pageResult,
  paging,
};

export type FilterEntry = { field: string; operator: string; value: string | undefined; subKey?: string };
