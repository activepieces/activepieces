import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient, gristInput } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristCreateTableOutputSchema } from '../../output-schemas';

export const gristCreateTableAction = createAction({
  auth: gristAuth,
  name: 'grist_create_table',
  outputSchema: gristCreateTableOutputSchema,
  displayName: 'Create Table',
  description: 'Creates a table with columns in a document.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a new table with the given columns to a Grist document and returns its table ID. Not idempotent: Grist renames the table if the ID already exists, so repeating the call creates another table.',
    idempotent: false,
  },
  props: {
    documentId: commonProps.document_id_text,
    tableId: Property.ShortText({
      displayName: 'Table ID',
      description:
        'Desired table ID (must start with a letter). Grist may adjust it; leave empty to let Grist choose.',
      required: false,
    }),
    columns: Property.Json({
      displayName: 'Columns',
      description:
        'A JSON array of column definitions, e.g. `[{"id": "Name", "fields": {"type": "Text", "label": "Name"}}]`.',
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
      `/docs/${documentId}/tables`,
      undefined,
      undefined,
      {
        tables: [
          {
            ...(tableId ? { id: tableId } : {}),
            columns: gristInput.asObjectArray({
              value: columns,
              name: 'Columns',
            }),
          },
        ],
      }
    );
  },
});
