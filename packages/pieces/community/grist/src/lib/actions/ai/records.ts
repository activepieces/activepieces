import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient, gristInput } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristAddRecordsOutputSchema, gristDeleteRecordsOutputSchema, gristListRecordsOutputSchema, gristUpdateColumnsOutputSchema } from '../../output-schemas';

export const gristAddRecordsAction = createAction({
  auth: gristAuth,
  name: 'grist_add_records',
  outputSchema: gristAddRecordsOutputSchema,
  displayName: 'Add Records',
  description: 'Adds one or more rows to a Grist table.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Appends rows to a Grist table in one call. Each item maps column IDs to values (use **List Columns** for the column IDs; reference-list and choice-list cells take `["L", ...]`). Returns the new row IDs. Not idempotent: every call inserts new rows.',
    idempotent: false,
  },
  props: {
    documentId: commonProps.document_id_text,
    tableId: commonProps.table_id_text,
    records: Property.Json({
      displayName: 'Records',
      description:
        'A JSON array of objects, one per row, mapping column ID to value. Example: `[{"Name": "Ada", "Age": 36}]`.',
      required: true,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, tableId, records } = context.propsValue;
    const rows = gristInput.asObjectArray({ value: records, name: 'Records' });
    const response = await client.makeRequest<{ records: { id: number }[] }>(
      HttpMethod.POST,
      `/docs/${documentId}/tables/${tableId}/records`,
      undefined,
      undefined,
      { records: rows.map((fields) => ({ fields })) }
    );
    return {
      record_ids: response.records.map((record) => record.id),
      count: response.records.length,
    };
  },
});

export const gristUpdateRecordsAction = createAction({
  auth: gristAuth,
  name: 'grist_update_records',
  outputSchema: gristUpdateColumnsOutputSchema,
  displayName: 'Update Records',
  description: 'Updates fields of existing rows in a Grist table.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Partially updates existing rows by row ID: only the columns you list change, other cells keep their values. Row IDs come from **List Records** or **Add Records**. Setting the same values again is a no-op.',
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    tableId: commonProps.table_id_text,
    records: Property.Json({
      displayName: 'Records',
      description:
        'A JSON array of `{"id": <rowId>, "fields": {"<columnId>": <value>}}` objects.',
      required: true,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, tableId, records } = context.propsValue;
    const rows = gristInput.asObjectArray({ value: records, name: 'Records' });
    rows.forEach((row) => {
      gristInput.asObject({ value: row['fields'], name: 'Each record fields' });
      if (typeof row['id'] !== 'number') {
        throw new Error('Each record needs a numeric id.');
      }
    });
    await client.makeRequest(
      HttpMethod.PATCH,
      `/docs/${documentId}/tables/${tableId}/records`,
      undefined,
      undefined,
      { records: rows }
    );
    return { success: true, updated_count: rows.length };
  },
});

export const gristListRecordsAction = createAction({
  auth: gristAuth,
  name: 'grist_list_records',
  outputSchema: gristListRecordsOutputSchema,
  displayName: 'List Records',
  description: 'Lists rows of a Grist table, optionally filtered and sorted.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Reads rows from a Grist table with optional exact-match filters, sort and limit. Use it to find row IDs before updating or deleting. Filter values are matched exactly against the listed values for each column.',
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    tableId: commonProps.table_id_text,
    filter: Property.Json({
      displayName: 'Filter',
      description:
        'Optional JSON object mapping column ID to the list of accepted values. Example: `{"Status": ["Open", "Pending"]}`.',
      required: false,
    }),
    sort: Property.ShortText({
      displayName: 'Sort',
      description:
        'Optional comma-separated column IDs; prefix with `-` for descending, e.g. `-Age,Name`.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of rows to return.',
      required: false,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, tableId, filter, sort, limit } = context.propsValue;
    const response = await client.makeRequest<{
      records: { id: number; fields: Record<string, unknown> }[];
    }>(
      HttpMethod.GET,
      `/docs/${documentId}/tables/${tableId}/records`,
      undefined,
      {
        filter:
          filter === undefined || filter === null
            ? undefined
            : JSON.stringify(
                gristInput.asObject({ value: filter, name: 'Filter' })
              ),
        sort: sort || undefined,
        limit: limit ?? undefined,
      }
    );
    return { records: response.records, count: response.records.length };
  },
});

export const gristDeleteRecordsAction = createAction({
  auth: gristAuth,
  name: 'grist_delete_records',
  outputSchema: gristDeleteRecordsOutputSchema,
  displayName: 'Delete Records',
  description: 'Deletes rows from a Grist table by row ID.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes rows by row ID (get IDs from **List Records**). Rows that no longer exist are ignored by Grist, so repeating the call is harmless.',
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    tableId: commonProps.table_id_text,
    rowIds: Property.Array({
      displayName: 'Row IDs',
      description: 'The numeric IDs of the rows to delete.',
      required: true,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, tableId, rowIds } = context.propsValue;
    const ids = gristInput.asNumberArray({ value: rowIds, name: 'Row IDs' });
    await client.makeRequest(
      HttpMethod.POST,
      `/docs/${documentId}/tables/${tableId}/records/delete`,
      undefined,
      undefined,
      ids
    );
    return { success: true, deleted_count: ids.length };
  },
});
