import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristListColumnsOutputSchema } from '../../output-schemas';

export const gristListColumnsAction = createAction({
  auth: gristAuth,
  name: 'grist_list_columns',
  outputSchema: gristListColumnsOutputSchema,
  displayName: 'List Columns',
  description: 'Lists the columns of a table.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Returns each column's ID, type, label and formula flag for a table. Use it to learn the column IDs and types needed by record actions.",
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    tableId: commonProps.table_id_text,
    includeHidden: Property.Checkbox({
      displayName: 'Include Hidden Columns',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, tableId, includeHidden } = context.propsValue;
    const response = await client.makeRequest<{ columns: unknown[] }>(
      HttpMethod.GET,
      `/docs/${documentId}/tables/${tableId}/columns`,
      undefined,
      { hidden: includeHidden ? 'true' : undefined }
    );
    return { columns: response.columns, count: response.columns.length };
  },
});
