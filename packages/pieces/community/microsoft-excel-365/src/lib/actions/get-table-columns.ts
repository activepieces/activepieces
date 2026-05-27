import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { commonProps } from '../common/props';
import { excelAuth } from '../auth';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const getTableColumnsAction = createAction({
  auth: excelAuth,
  name: 'get_table_columns',
  description: 'List columns of a table in a worksheet',
  displayName: 'Get Table Columns',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    tableId: commonProps.tableId,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Limit the number of columns retrieved',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId, worksheetId, tableId } = propsValue;
    const limit = propsValue['limit'];
    const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const client = createMSGraphClient(auth['access_token'], cloud);
    let apiCall = client.api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/columns`);

    if (limit) {
      apiCall = apiCall.top(limit);
    }

    const response = await apiCall.get();

    const columnNames = response.value.map(
      (column: { name: any }) => column.name
    );

    return columnNames;
  },
});
