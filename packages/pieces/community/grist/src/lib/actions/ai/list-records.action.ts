import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient, gristInput } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristListRecordsOutputSchema } from '../../output-schemas';

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
      'Reads rows from a Grist table with optional exact-match filters, sort and limit (default 100 rows; Grist has no paging, so narrow with a filter or sort to reach other rows). Use it to find row IDs before updating or deleting. Filter values are matched exactly against the listed values for each column.',
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
      description: 'Maximum number of rows to return. Defaults to 100.',
      defaultValue: 100,
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
        limit: limit ?? 100,
      }
    );
    return { records: response.records, count: response.records.length };
  },
});
