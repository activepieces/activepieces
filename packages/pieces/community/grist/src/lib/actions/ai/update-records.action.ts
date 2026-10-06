import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient, gristInput } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristUpdateColumnsOutputSchema } from '../../output-schemas';

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
