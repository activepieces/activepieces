import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { fieldsJsonProp, moduleProp, recordList } from '../../ai-common';
import { recordFromJson } from '../../common';
import { searchRecordListSchema } from '../../output-schemas';
import { VtigerCredentials, vtigerRest } from '../../rest-client';
import {
  assertModuleName,
  buildWhere,
  clampLimit,
  filterValueToString,
  pagedQuery,
  VtqlFilter,
} from '../../vtql';

const SEARCH_MAX = 1000;

export function filtersFromJson({ value, match }: { value: unknown; match: unknown }): VtqlFilter[] {
  const fields = recordFromJson({ value, label: 'Filters' });
  return Object.entries(fields).flatMap(([field, raw]): VtqlFilter[] => {
    const text = filterValueToString(raw);
    if (text === undefined) {
      return [];
    }
    return [{ field, value: text, operator: match === 'contains' && typeof raw === 'string' ? 'LIKE' : '=' }];
  });
}

export async function searchModule({
  creds,
  module,
  filters,
  limit,
}: {
  creds: VtigerCredentials;
  module: string;
  filters: VtqlFilter[];
  limit: number;
}) {
  return pagedQuery<Record<string, unknown>>({
    module: assertModuleName(module),
    where: buildWhere({ filters }),
    limit,
    fetchPage: async (query) =>
      recordList(await vtigerRest<unknown>({ creds, method: HttpMethod.GET, path: 'query', query: { query } })),
  });
}

export const searchModuleRecordsAction = createAction({
  auth: vtigerAuth,
  name: 'search_module_records',
  displayName: 'Search Module Records',
  description: 'Finds records in a Vtiger module whose fields match the given values.',
  classification: 'SEARCH',
  audience: 'ai',
  aiMetadata: {
    description:
      'Finds records in one module whose fields match all given values, filtered server-side. Exact match by default; contains does a substring match on text values. With no filters it lists records. Use Describe Module for field names and Query Records for OR conditions or sorting.',
    idempotent: true,
  },
  outputSchema: searchRecordListSchema,
  props: {
    module: moduleProp(),
    filters: fieldsJsonProp({
      displayName: 'Filters',
      description: 'JSON object of field API name to value, for example {"lastname": "Smith", "leadsource": "Web Site"}.',
      required: false,
    }),
    match: Property.StaticDropdown({
      displayName: 'Match',
      required: false,
      defaultValue: 'exact',
      options: {
        options: [
          { label: 'Exact', value: 'exact' },
          { label: 'Contains (text values)', value: 'contains' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: `Maximum records to return, 1 to ${SEARCH_MAX} (default 100).`,
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { records, hasMore } = await searchModule({
      creds: auth.props,
      module: propsValue.module,
      filters: filtersFromJson({ value: propsValue.filters, match: propsValue.match }),
      limit: clampLimit({ value: propsValue.limit, fallback: 100, max: SEARCH_MAX }),
    });
    return { records, count: records.length, hasMore };
  },
});
