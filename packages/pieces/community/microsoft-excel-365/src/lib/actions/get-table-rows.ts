import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { commonProps } from '../common/props';
import { excelAuth } from '../auth';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const getTableRowsAction = createAction({
  auth: excelAuth,
  name: 'get_table_rows',
  classification: 'SEARCH',
  description: 'List rows of a table in a worksheet',
  audience: 'both',
  aiMetadata: { description: 'List the data rows of a defined Excel table (by table id) in a worksheet, returning each row as an array of cell values. Use for structured tables; for arbitrary worksheet rows use Get Worksheet Rows, or a specific range with Get Cells in Range. Read-only and idempotent; an optional limit caps how many rows are returned.', idempotent: true },
  displayName: 'Get Table Rows',
  propertyGroups: [
    {
      key: 'workbook',
      display: 'section',
      label: 'Workbook',
      icon: 'file',
      props: ['storageSource', 'siteId', 'documentId', 'workbookId', 'worksheetId', 'tableId'],
    },
  ],
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    tableId: commonProps.tableId,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Empty returns all rows.',
      required: false,
      advanced: true,
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

    const rowsValues: unknown[] = [];
    let response = await apiCall.get();
    while (response) {
      rowsValues.push(...response.value.map((row: { values: unknown[] }) => row.values[0]));
      if (limit && rowsValues.length >= limit) {
        break;
      }
      const nextLink = response['@odata.nextLink'];
      response = nextLink ? await client.api(nextLink).get() : undefined;
    }

    return limit ? rowsValues.slice(0, limit) : rowsValues;
  },
});
