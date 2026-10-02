import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient, gristInput } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristAddColumnsOutputSchema, gristDeleteColumnOutputSchema, gristListColumnsOutputSchema, gristUpdateColumnsOutputSchema } from '../../output-schemas';

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
