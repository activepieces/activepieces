import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient, gristInput } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristAddColumnsOutputSchema } from '../../output-schemas';

export const gristAddColumnsAction = createAction({
  auth: gristAuth,
  name: 'grist_add_columns',
  outputSchema: gristAddColumnsOutputSchema,
  displayName: 'Add Columns',
  description: 'Adds columns to a table.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds one or more columns to an existing table and returns their IDs. Not idempotent: repeating the call adds further columns (Grist renames duplicates).',
    idempotent: false,
  },
  props: {
    documentId: commonProps.document_id_text,
    tableId: commonProps.table_id_text,
    columns: Property.Json({
      displayName: 'Columns',
      description:
        'A JSON array like `[{"id": "Age", "fields": {"type": "Int", "label": "Age"}}]`.',
      required: true,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, tableId, columns } = context.propsValue;
    return await client.makeRequest(
      HttpMethod.POST,
      `/docs/${documentId}/tables/${tableId}/columns`,
      undefined,
      undefined,
      { columns: gristInput.asObjectArray({ value: columns, name: 'Columns' }) }
    );
  },
});
