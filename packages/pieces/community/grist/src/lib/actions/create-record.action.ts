import { gristAuth } from '../..';
import { createAction } from '@activepieces/pieces-framework';
import { commonProps } from '../common/props';
import { GristAPIClient, transformTableColumnValues } from '../common/helpers';

export const gristCreateRecordAction = createAction({
  auth: gristAuth,
  name: 'grist-create-record',
  displayName: 'Create Record',
  description: 'Creates a new record in specific table.',
  props: {
    workspace_id: commonProps.workspace_id,
    document_id: commonProps.document_id,
    table_id: commonProps.table_id,
    table_columns: commonProps.table_columns,
  },
  async run(context) {
    const documentId = context.propsValue.document_id;
    const tableId = context.propsValue.table_id;
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

    const createRecordResponse = await client.addRecordsToTable(
      documentId,
      tableId,
      {
        records: [{ fields: transformedColumnValues }],
      }
    );

    return {
      id: createRecordResponse.records[0].id,
      fields: transformedColumnValues,
    };
  },
});
