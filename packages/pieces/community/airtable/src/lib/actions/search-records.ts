import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { airtableAuth } from '../auth';
import { AirtableRecord } from '../common/models';

export const airtableSearchRecordsAction = createAction({
  auth: airtableAuth,
  name: 'search_records',
  displayName: 'Search Records (Agent)',
  description: 'Find records where a field matches a value.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Finds records in a table where a single field contains or exactly equals a value — the simple "find the record where X = Y" path that builds the Airtable formula for you. Use this by default to resolve a record ID from a known field value; for complex formula filters or sorting use List Records (Agent). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    base_id: Property.ShortText({
      displayName: 'Base ID',
      description:
        'The Airtable base ID (e.g. "appXXXXXXXXXXXXXX"). Resolve it with List Bases (Agent).',
      required: true,
    }),
    table_id_or_name: Property.ShortText({
      displayName: 'Table ID or Name',
      description:
        'The table ID (e.g. "tblXXXXXXXXXXXXXX") or its exact name. Resolve it with Get Base Schema (Agent).',
      required: true,
    }),
    search_field: Property.ShortText({
      displayName: 'Search Field',
      description:
        'The exact name of the field to match against. Resolve names with Get Base Schema (Agent).',
      required: true,
    }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'The value to look for in the search field.',
      required: true,
    }),
    match_mode: Property.StaticDropdown({
      displayName: 'Match Mode',
      description:
        '"contains" (default) does a case-sensitive substring match; "exact" requires the whole field to equal the value. Exact compares the field as text, so it also matches number and checkbox fields by their text value.',
      required: false,
      defaultValue: 'contains',
      options: {
        options: [
          { label: 'Contains', value: 'contains' },
          { label: 'Exact', value: 'exact' },
        ],
      },
    }),
    view: Property.ShortText({
      displayName: 'View',
      description: 'Optional view ID or name to restrict the search to.',
      required: false,
    }),
    max_records: Property.Number({
      displayName: 'Max Records',
      description: 'Optional maximum number of matching records to return.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const {
      base_id,
      table_id_or_name,
      search_field,
      search_value,
      match_mode,
      view,
      max_records,
    } = propsValue;

    const escapedValue = String(search_value)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');
    const formula =
      match_mode === 'exact'
        ? `{${search_field}}&""="${escapedValue}"`
        : `FIND("${escapedValue}",{${search_field}})`;

    const queryParams: QueryParams = {
      filterByFormula: formula,
    };
    if (view) {
      queryParams['view'] = view;
    }
    if (max_records !== undefined && max_records !== null) {
      queryParams['maxRecords'] = String(max_records);
    }

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.airtable.com/v0/${base_id}/${encodeURIComponent(
        table_id_or_name
      )}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
      queryParams,
    };

    try {
      const response = await httpClient.sendRequest<{
        records: AirtableRecord[];
      }>(request);
      return {
        records: response.body.records,
        count: response.body.records.length,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error(
          'Airtable rejected the request (permission). Ensure the token has data.records.read scope and access to this base.'
        );
      }
      if (status === 404) {
        throw new Error(
          `Base "${base_id}" or table "${table_id_or_name}" was not found. Verify the IDs with List Bases (Agent) and Get Base Schema (Agent).`
        );
      }
      if (status === 422) {
        throw new Error(
          `Airtable rejected the search (422). Check that the field "${search_field}" exists in the table.`
        );
      }
      if (status === 429) {
        throw new Error('Airtable rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
