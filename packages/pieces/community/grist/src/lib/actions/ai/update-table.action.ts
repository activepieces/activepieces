import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient, gristInput } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristDeleteColumnOutputSchema } from '../../output-schemas';

export const gristUpdateTableAction = createAction({
  auth: gristAuth,
  name: 'grist_update_table',
  outputSchema: gristDeleteColumnOutputSchema,
  displayName: 'Update Table',
  description: 'Changes table settings such as its ID.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates table-level settings (for example renaming via `{"tableId": "NewName"}` or `{"onDemand": true}`). Only the fields supplied change. Setting the same values again is a no-op.',
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    tableId: commonProps.table_id_text,
    fields: Property.Json({
      displayName: 'Fields',
      description: 'A JSON object of table fields to change.',
      required: true,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, tableId, fields } = context.propsValue;
    await client.makeRequest(
      HttpMethod.PATCH,
      `/docs/${documentId}/tables`,
      undefined,
      undefined,
      {
        tables: [
          {
            id: tableId,
            fields: gristInput.asObject({ value: fields, name: 'Fields' }),
          },
        ],
      }
    );
    return { success: true };
  },
});
