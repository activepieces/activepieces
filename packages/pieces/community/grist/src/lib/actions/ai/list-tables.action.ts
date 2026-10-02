import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristListTablesOutputSchema } from '../../output-schemas';

export const gristListTablesAction = createAction({
  auth: gristAuth,
  name: 'grist_list_tables',
  outputSchema: gristListTablesOutputSchema,
  displayName: 'List Tables',
  description: 'Lists the tables in a document.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the table IDs of a Grist document (optionally with their columns). Use it to get the table ID that record, column and SQL actions need.',
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    includeColumns: Property.Checkbox({
      displayName: 'Include Columns',
      description: "Also return each table's columns.",
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, includeColumns } = context.propsValue;
    const response = await client.makeRequest<{ tables: unknown[] }>(
      HttpMethod.GET,
      `/docs/${documentId}/tables`,
      undefined,
      { expand: includeColumns ? 'column' : undefined }
    );
    return { tables: response.tables, count: response.tables.length };
  },
});
