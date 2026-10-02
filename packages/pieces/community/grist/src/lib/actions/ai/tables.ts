import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient, gristInput } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristCreateTableOutputSchema, gristListTablesOutputSchema, gristDeleteColumnOutputSchema } from '../../output-schemas';

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
