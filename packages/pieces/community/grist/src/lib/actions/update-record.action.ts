import { gristAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { commonProps } from '../common/props';
import { GristAPIClient, transformTableColumnValues } from '../common/helpers';

export const gristUpdateRecordAction = createAction({
  auth: gristAuth,
  name: 'grist-update-record',
  displayName: 'Update Record',
  description: 'Updates an existing record in specific table.',
  props: {
    workspace_id: commonProps.workspace_id,
    document_id: commonProps.document_id,
    table_id: commonProps.table_id,
    record_id: Property.Number({
      displayName: 'Record ID',
      required: true,
    }),
    table_columns: commonProps.table_columns,
  },
  async run(context) {
    const documentId = context.propsValue.document_id;
    const tableId = context.propsValue.table_id;
    const recordId = context.propsValue.record_id;
    const tableColumnValues = context.propsValue.table_columns;

    const client = new GristAPIClient({
      domainUrl: context.auth.domain,
      apiKey: context.auth.apiKey,
    });

    const tableColumnSchema = await client.listTableColumns(
      documentId as string,
      tableId as string
    );

    const transformedColumnValues = transformTableColumnValues({
      tableColumnSchema,
      tableColumnValues,
    });

    const updateRecordResponse = await client.updateRcordsInTable(
      documentId,
      tableId,
      {
        records: [{ id: recordId, fields: transformedColumnValues }],
      }
    );

    return {
      id: recordId,
      fields: transformedColumnValues,
    };
  },
});
