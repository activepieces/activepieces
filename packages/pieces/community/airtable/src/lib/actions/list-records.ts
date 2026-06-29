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

export const airtableListRecordsAction = createAction({
  auth: airtableAuth,
  name: 'list_records',
  displayName: 'List Records (Agent)',
  description: 'List or query records in an Airtable table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists records from a table with optional Airtable filterByFormula, view, sort, field selection and limits — the power-user query path. Use this when you need a formula filter or sorting; for a simple "field equals/contains value" lookup prefer Search Records (Agent). Read-only and idempotent.',
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
    filter_by_formula: Property.ShortText({
      displayName: 'Filter By Formula',
      description:
        'Optional Airtable formula to filter rows, e.g. {Status}="Done" or AND({Score}>5, FIND("ace", LOWER({Name}))). Field names go in {curly braces}.',
      required: false,
    }),
    view: Property.ShortText({
      displayName: 'View',
      description:
        'Optional view ID or name to restrict and order results to that view.',
      required: false,
    }),
    max_records: Property.Number({
      displayName: 'Max Records',
      description:
        'Optional maximum total number of records to return across all pages.',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description:
        'Optional number of records per page (1-100, default 100). This call returns a single page only.',
      required: false,
    }),
    sort: Property.Json({
      displayName: 'Sort',
      description:
        'Optional JSON array of sort directives, e.g. [{"field": "Name", "direction": "asc"}]. Direction is "asc" or "desc".',
      required: false,
    }),
    fields: Property.Array({
      displayName: 'Fields',
      description:
        'Optional list of field names to return; omit to return all fields.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const {
      base_id,
      table_id_or_name,
      filter_by_formula,
      view,
      max_records,
      page_size,
      sort,
      fields,
    } = propsValue;

    const queryParams: QueryParams = {};
    if (filter_by_formula) {
      queryParams['filterByFormula'] = filter_by_formula;
    }
    if (view) {
      queryParams['view'] = view;
    }
    if (max_records !== undefined && max_records !== null) {
      queryParams['maxRecords'] = String(max_records);
    }
    if (page_size !== undefined && page_size !== null) {
      queryParams['pageSize'] = String(page_size);
    }
    if (sort) {
      const sortArray = sort as unknown as {
        field: string;
        direction?: string;
      }[];
      sortArray.forEach((entry, index) => {
        queryParams[`sort[${index}][field]`] = entry.field;
        if (entry.direction) {
          queryParams[`sort[${index}][direction]`] = entry.direction;
        }
      });
    }
    if (fields) {
      const fieldList = fields as string[];
      fieldList.forEach((field, index) => {
        queryParams[`fields[${index}]`] = field;
      });
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
        offset?: string;
      }>(request);
      return {
        records: response.body.records,
        count: response.body.records.length,
        offset: response.body.offset ?? null,
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
          'Airtable rejected the query parameters (422). Check the filterByFormula syntax, sort directives, and field names.'
        );
      }
      if (status === 429) {
        throw new Error('Airtable rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
