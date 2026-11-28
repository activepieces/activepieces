import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { sprinklrAuth } from '../auth';
import { sprinklrCase, SprinklrCaseOutput } from '../common/case';
import { sprinklrCaseWrite } from '../common/case-write';
import { sprinklrClient } from '../common/client';
import { sprinklrEndpoints } from '../common/endpoints';
import { sprinklrErrors } from '../common/errors';
import { sprinklrTime } from '../common/time';

const MAX_RESULTS_CAP = 200;
const PAGE_SIZE_CAP = 100;

type SortKey = 'createdTime' | 'modifiedTime';
type SortOrder = 'DESC' | 'ASC';

function parseRawFilter(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error('Raw Filter is not valid JSON. Paste a filter object such as {"type": "AND", "filters": [...]}.');
    }
  }
  if (!sprinklrErrors.isRecord(parsed)) {
    throw new Error('Raw Filter must be a JSON object such as {"type": "AND", "filters": [...]}.');
  }
  return Object.keys(parsed).length > 0 ? parsed : undefined;
}

function customFieldFilters(input: unknown): SearchFilter[] {
  const value = sprinklrCaseWrite.parseStructured({ value: input, field: 'Custom Fields' });
  if (value === undefined || value === null || value === '') {
    return [];
  }
  if (!sprinklrErrors.isRecord(value)) {
    throw new Error('Custom Fields must be pairs of a custom field name and its value. Check the Custom Fields input.');
  }
  return Object.entries(value).flatMap(([key, raw]) => {
    const field = key.trim();
    const values = (Array.isArray(raw) ? raw : [raw])
      .filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
      .map((v) => String(v));
    if (field.length === 0 || values.length === 0) {
      return [];
    }
    return [{ type: 'IN', key: `workflow.customProperties.${field}`, values }];
  });
}

function buildFilter(input: SearchCasesInput): Record<string, unknown> | undefined {
  const raw = parseRawFilter(input.rawFilter);
  if (raw) {
    return raw;
  }
  const filters: SearchFilter[] = [];
  const createdAfter = sprinklrTime.toEpochMs({ value: input.createdAfter, field: 'Created After' });
  const createdBefore = sprinklrTime.toEpochMs({ value: input.createdBefore, field: 'Created Before' });
  const modifiedAfter = sprinklrTime.toEpochMs({ value: input.modifiedAfter, field: 'Modified After' });
  if (createdAfter !== undefined) {
    filters.push({ type: 'GT', key: 'createdTime', values: [String(createdAfter)] });
  }
  if (createdBefore !== undefined) {
    filters.push({ type: 'LT', key: 'createdTime', values: [String(createdBefore)] });
  }
  if (modifiedAfter !== undefined) {
    filters.push({ type: 'GT', key: 'modifiedTime', values: [String(modifiedAfter)] });
  }
  const queueId = typeof input.queueId === 'string' ? input.queueId.trim() : '';
  if (queueId.length > 0) {
    filters.push({ type: 'IN', key: 'workflow.queues.queueId', values: [queueId] });
  }
  filters.push(...customFieldFilters(input.customFields));
  if (filters.length === 0) {
    return undefined;
  }
  return { type: 'AND', filters };
}

function clampMaxResults(value: unknown): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : sprinklrClient.DEFAULT_MAX_RESULTS;
  return Math.min(Math.max(n, 1), MAX_RESULTS_CAP);
}

function buildBody(input: SearchCasesInput): { body: Record<string, unknown>; maxResults: number } {
  const maxResults = clampMaxResults(input.maxResults);
  const keyword = typeof input.keyword === 'string' ? input.keyword.trim() : '';
  const filter = buildFilter(input);
  const body: Record<string, unknown> = {
    ...(keyword.length > 0 ? { q: keyword } : {}),
    ...(filter ? { filter } : {}),
    sorts: [{ key: input.sortBy ?? 'createdTime', order: input.sortOrder ?? 'DESC' }],
    page: { size: Math.min(maxResults, PAGE_SIZE_CAP) },
  };
  return { body, maxResults };
}

const outputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Cases Returned', format: 'number' },
    { key: 'totalCount', label: 'Total Matches', format: 'number' },
    { key: 'cases', label: 'Cases', labelKey: 'subject', listItems: sprinklrCase.fields },
  ],
};

export const searchCasesAction = createAction({
  auth: sprinklrAuth,
  name: 'search_cases',
  classification: 'SEARCH',
  displayName: 'Search Cases',
  description: 'Finds cases by keyword, dates, queue or custom fields.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Sprinklr cases by keyword, created or modified time, queue ID or custom field values, newest first by default. Use Get Case instead when you know the case number. Returns up to 200 cases in one call; read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Text to look for in the case subject and description.',
      placeholder: 'refund',
      required: false,
    }),
    created_after: Property.DateTime({
      displayName: 'Created After',
      description: 'Only cases created after this time.',
      required: false,
    }),
    created_before: Property.DateTime({
      displayName: 'Created Before',
      description: 'Only cases created before this time.',
      required: false,
    }),
    modified_after: Property.DateTime({
      displayName: 'Modified After',
      description: 'Only cases changed after this time.',
      required: false,
    }),
    queue_id: Property.ShortText({
      displayName: 'Queue ID',
      description: 'Only cases in this work queue. Find the ID in Sprinklr.',
      placeholder: '5001',
      required: false,
    }),
    custom_fields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Custom field ID and the value it must have.',
      required: false,
    }),
    sort_by: Property.StaticDropdown<SortKey, false>({
      displayName: 'Sort By',
      required: false,
      defaultValue: 'createdTime',
      advanced: true,
      options: {
        disabled: false,
        options: [
          { label: 'Created Time', value: 'createdTime' },
          { label: 'Modified Time', value: 'modifiedTime' },
        ],
      },
    }),
    sort_order: Property.StaticDropdown<SortOrder, false>({
      displayName: 'Sort Order',
      required: false,
      defaultValue: 'DESC',
      advanced: true,
      options: {
        disabled: false,
        options: [
          { label: 'Newest First', value: 'DESC' },
          { label: 'Oldest First', value: 'ASC' },
        ],
      },
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Most cases to return, up to 200.',
      required: false,
      defaultValue: 20,
      display: 'stepper',
      min: 1,
      max: MAX_RESULTS_CAP,
      step: 1,
      advanced: true,
    }),
    raw_filter: Property.Json({
      displayName: 'Raw Filter',
      description: 'A Sprinklr search filter. Replaces the filters above.',
      required: false,
      advanced: true,
    }),
  },
  propertyGroups: [
    {
      key: 'filters',
      display: 'section',
      label: 'Filters',
      icon: 'filter',
      props: ['keyword', 'created_after', 'created_before', 'modified_after', 'queue_id', 'custom_fields'],
    },
  ],
  async run(context) {
    const p = context.propsValue;
    const { body, maxResults } = buildBody({
      keyword: p.keyword,
      createdAfter: p.created_after,
      createdBefore: p.created_before,
      modifiedAfter: p.modified_after,
      queueId: p.queue_id,
      customFields: p.custom_fields,
      sortBy: p.sort_by ?? undefined,
      sortOrder: p.sort_order ?? undefined,
      maxResults: p.max_results,
      rawFilter: p.raw_filter,
    });
    const result = await sprinklrClient.search({
      auth: context.auth,
      entity: sprinklrEndpoints.SEARCH_ENTITY.CASE,
      body,
      maxResults,
    });
    const cases: SprinklrCaseOutput[] = result.results.map((item) => sprinklrCase.normalize(item));
    return {
      count: cases.length,
      totalCount: result.count ?? null,
      cases,
    };
  },
  outputSchema,
});

type SearchFilter = { type: string; key: string; values: string[] };

type SearchCasesInput = {
  keyword?: unknown;
  createdAfter?: unknown;
  createdBefore?: unknown;
  modifiedAfter?: unknown;
  queueId?: unknown;
  customFields?: unknown;
  sortBy?: SortKey;
  sortOrder?: SortOrder;
  maxResults?: unknown;
  rawFilter?: unknown;
};
