import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient, gristInput } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristUpdateColumnsOutputSchema } from '../../output-schemas';

export const gristUpdateColumnsAction = createAction({
  auth: gristAuth,
  name: 'grist_update_columns',
  outputSchema: gristUpdateColumnsOutputSchema,
  displayName: 'Update Columns',
  description: 'Changes the settings of existing columns.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates column settings (label, type, formula, widget options) by column ID; only the supplied fields change. Changing a label also renames the column ID unless `untieColIdFromLabel` is true, so re-list columns before using the ID again. Setting the same values again is a no-op.',
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    tableId: commonProps.table_id_text,
    columns: Property.Json({
      displayName: 'Columns',
      description:
        'A JSON array like `[{"id": "Age", "fields": {"label": "Years"}}]`.',
      required: true,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, tableId, columns } = context.propsValue;
    const items = gristInput.asObjectArray({ value: columns, name: 'Columns' });
    items.forEach((item) =>
      gristInput.asObject({ value: item['fields'], name: 'Each column fields' })
    );
    await client.makeRequest(
      HttpMethod.PATCH,
      `/docs/${documentId}/tables/${tableId}/columns`,
      undefined,
      undefined,
      { columns: items }
    );
    return { success: true, updated_count: items.length };
  },
});
