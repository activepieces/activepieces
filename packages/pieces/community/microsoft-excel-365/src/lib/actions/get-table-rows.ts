import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { commonProps } from '../common/props';
import { excelAuth } from '../auth';
import { getDrivePath, createMSGraphClient } from '../common/helpers';
import { excelCommon } from '../common/common';

export const getTableRowsAction = createAction({
  auth: excelAuth,
  name: 'get_table_rows',
  description: 'List rows of a table in a worksheet',
  audience: 'both',
  aiMetadata: { description: 'List the data rows of a defined Excel table (by table id) in a worksheet, returning each row as an array of cell values. Use for structured tables; for arbitrary worksheet rows use Get Worksheet Rows, or a specific range with Get Cells in Range. Read-only and idempotent; an optional limit caps how many rows are returned.', idempotent: true },
  displayName: 'Get Table Rows',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    tableId: commonProps.tableId,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Limit the number of rows retrieved',
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
    let apiCall = client.api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/rows`);

    if (limit) {
      apiCall = apiCall.top(limit);
    }

    const response = await apiCall.get();

    const rowsValues = response.value.map(
      (row: { values: any[] }) => row.values[0]
    );

    return rowsValues;
  },
});
