import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knackApiCall } from '../common/client';
import { knackAuth } from '../common/auth';
import { safeJsonParse, splitKnackRecord } from '../common/props';
import { searchRecordsOutputSchema } from '../common/schemas';

export const searchRecordsAction = createAction({
  auth: knackAuth,
  name: 'search_records',
  classification: 'SEARCH',
  displayName: 'Search Records (Agent)',
  description: 'Searches records in a Knack object with filter rules.',
  audience: 'ai',
  outputSchema: searchRecordsOutputSchema,
  aiMetadata: {
    description: 'Searches a Knack object with filter rules and returns one page of records (ID plus field values keyed by "field_N" and "field_N_raw") with total counts. Each rule is {"field":"field_N","operator":"is","value":"..."}; operators include "is", "is not", "contains", "does not contain", "starts with", "ends with", "is blank", "is not blank", "higher than", "lower than", "is before", "is after". Get field keys from Get Object Fields (Agent). Leave rules empty to list records. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    object_key: Property.ShortText({
      displayName: 'Object Key',
      description: 'Knack object key such as object_1, from List Objects (Agent).',
      required: true,
    }),
    match: Property.StaticDropdown<string>({
      displayName: 'Match',
      description: 'Whether a record must match all rules ("and") or any rule ("or").',
      required: false,
      options: {
        options: [
          { label: 'All rules (and)', value: 'and' },
          { label: 'Any rule (or)', value: 'or' },
        ],
      },
    }),
    rules: Property.Json({
      displayName: 'Filter Rules',
      description: 'JSON array of {"field", "operator", "value"} rule objects.',
      required: false,
    }),
    sort_field: Property.ShortText({
      displayName: 'Sort Field',
      description: 'Field key to sort by, e.g. "field_1".',
      required: false,
    }),
    sort_order: Property.StaticDropdown<string>({
      displayName: 'Sort Order',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1. Defaults to 1.',
      required: false,
    }),
    rows_per_page: Property.Number({
      displayName: 'Rows Per Page',
      description: 'Records per page, 1 to 1000. Defaults to 25.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { rules, match: wrappedMatch } = parseRules(propsValue.rules);
    const match = resolveMatch({ explicit: propsValue.match, wrapped: wrappedMatch });
    const page = clampInteger({ value: propsValue.page, min: 1, max: Number.MAX_SAFE_INTEGER, fallback: 1 });
    const rowsPerPage = clampInteger({ value: propsValue.rows_per_page, min: 1, max: 1000, fallback: 25 });
    const sortField = propsValue.sort_field?.trim();

    const response = await knackApiCall<KnackRecordsPage>({
      method: HttpMethod.GET,
      auth,
      resourceUri: `/objects/${encodeURIComponent(propsValue.object_key.trim())}/records`,
      query: {
        filters: rules.length > 0 ? JSON.stringify({ match, rules }) : undefined,
        sort_field: sortField ? sortField : undefined,
        sort_order: sortField ? propsValue.sort_order ?? 'asc' : undefined,
        page,
        rows_per_page: rowsPerPage,
      },
    });

    return {
      records: (response.records ?? []).map((record) => splitKnackRecord(record)),
      total_records: Number(response.total_records ?? 0),
      total_pages: Number(response.total_pages ?? 0),
      current_page: Number(response.current_page ?? page),
    };
  },
});

function parseRules(value: unknown): ParsedRules {
  if (value === undefined || value === null || value === '') {
    return { rules: [], match: undefined };
  }
  const parsed: unknown = typeof value === 'string' ? safeJsonParse(value) : value;
  if (Array.isArray(parsed)) {
    return { rules: parsed, match: undefined };
  }
  if (typeof parsed === 'object' && parsed !== null && 'rules' in parsed && Array.isArray(parsed.rules)) {
    const wrapped = 'match' in parsed ? parsed.match : undefined;
    return { rules: parsed.rules, match: typeof wrapped === 'string' ? wrapped : undefined };
  }
  throw new Error('Filter Rules must be a JSON array of rules, e.g. [{"field":"field_1","operator":"is","value":"x"}].');
}

function resolveMatch({ explicit, wrapped }: { explicit: string | undefined; wrapped: string | undefined }): 'and' | 'or' {
  for (const candidate of [explicit, wrapped]) {
    if (candidate === 'and' || candidate === 'or') {
      return candidate;
    }
  }
  return 'and';
}

function clampInteger({ value, min, max, fallback }: { value: number | undefined; min: number; max: number; fallback: number }): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.floor(value)));
}

type ParsedRules = {
  rules: unknown[];
  match: string | undefined;
};

type KnackRecordsPage = {
  records?: Record<string, unknown>[];
  total_records?: number | string;
  total_pages?: number | string;
  current_page?: number | string;
};
