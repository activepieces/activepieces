import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristDeleteColumnOutputSchema } from '../../output-schemas';

export const gristDeleteColumnAction = createAction({
  auth: gristAuth,
  name: 'grist_delete_column',
  outputSchema: gristDeleteColumnOutputSchema,
  displayName: 'Delete Column',
  description: 'Deletes a column and its data from a table.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently removes a column and all its cell values. Get column IDs from **List Columns**. Deleting a column that is already gone fails with not found.',
    idempotent: false,
  },
  props: {
    documentId: commonProps.document_id_text,
    tableId: commonProps.table_id_text,
    columnId: Property.ShortText({
      displayName: 'Column ID',
      description: 'The column ID from **List Columns**.',
      required: true,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, tableId, columnId } = context.propsValue;
    await client.makeRequest(
      HttpMethod.DELETE,
      `/docs/${documentId}/tables/${tableId}/columns/${columnId}`,
      undefined,
      undefined
    );
    return { success: true };
  },
});
