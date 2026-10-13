import { Property } from '@activepieces/pieces-framework';
import { systemeIoCommon, systemeIoInput } from '../../common/client';

async function list<T extends { id?: unknown }, R>({
  apiKey,
  url,
  query,
  maxResults,
  startingAfter,
  map,
}: {
  apiKey: string;
  url: string;
  query?: Record<string, string | number | boolean | undefined>;
  maxResults: unknown;
  startingAfter: unknown;
  map: (row: T) => R;
}) {
  const page = await systemeIoCommon.paginate<T>({
    auth: apiKey,
    url,
    query,
    maxItems: systemeIoInput.clampInt({ value: maxResults, name: 'max_results', min: 1, max: 1000, fallback: 100 }),
    startingAfter: systemeIoInput.optionalId({ value: startingAfter, name: 'starting_after' }),
  });
  return {
    items: page.items.map(map),
    count: page.items.length,
    has_more: page.hasMore,
    next_cursor: page.nextCursor,
  };
}

function optionalBoolean({ value, name }: { value: unknown; name: string }): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new Error(`${name} must be true or false.`);
}

function fieldsInput({ value }: { value: unknown }): { slug: string; value: string | null }[] {
  if (value === undefined || value === null || value === '') return [];
  if (!Array.isArray(value)) {
    throw new Error('fields must be a list of {"slug": "...", "value": "..."} objects.');
  }
  return value.map((item: unknown, index: number) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`fields[${index}] must be an object with a slug and a value.`);
    }
    const slug: unknown = Reflect.get(item, 'slug');
    const raw: unknown = Reflect.get(item, 'value');
    if (typeof slug !== 'string' || slug.trim() === '') {
      throw new Error(`fields[${index}].slug is required (get slugs from systeme_list_contact_fields).`);
    }
    const fieldValue = raw === undefined || raw === null || raw === '' ? null : String(raw);
    return { slug: slug.trim(), value: fieldValue };
  });
}

const maxResultsProp = Property.Number({
  displayName: 'Max Results',
  description: 'Maximum rows to return, 1-1000 (default 100). The action pages automatically.',
  required: false,
});

const startingAfterProp = Property.ShortText({
  displayName: 'Starting After',
  description: 'Optional cursor: the next_cursor value from a previous call, to continue listing.',
  required: false,
});

export const aiCommon = { list, optionalBoolean, fieldsInput, maxResultsProp, startingAfterProp };
