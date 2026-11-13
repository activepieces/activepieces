import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient, gristInput } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristAddRecordsOutputSchema } from '../../output-schemas';

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
