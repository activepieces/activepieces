import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient, gristInput } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristDeleteRecordsOutputSchema } from '../../output-schemas';

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
