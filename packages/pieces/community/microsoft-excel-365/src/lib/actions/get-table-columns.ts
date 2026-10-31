import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { commonProps } from '../common/props';
import { excelAuth } from '../auth';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const getTableColumnsAction = createAction({
  auth: excelAuth,
  name: 'get_table_columns',
  classification: 'SEARCH',
  description: 'List columns of a table in a worksheet',
  audience: 'both',
  aiMetadata: { description: 'List the column names of a specific named table in a worksheet, optionally capped by a limit. Pick this to discover a table schema before mapping fields for row reads or writes. Use Get Worksheet Columns instead when the data is loose cells rather than a formal table. Read-only and idempotent.', idempotent: true },
  displayName: 'Get Table Columns',
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
      description: 'Empty returns all columns.',
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
    let apiCall = client.api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/columns`);

    if (limit) {
      apiCall = apiCall.top(limit);
    }

    const columnNames: unknown[] = [];
    let response = await apiCall.get();
    while (response) {
      columnNames.push(...response.value.map((column: { name: unknown }) => column.name));
      if (limit && columnNames.length >= limit) {
        break;
      }
      const nextLink = response['@odata.nextLink'];
      response = nextLink ? await client.api(nextLink).get() : undefined;
    }

    return limit ? columnNames.slice(0, limit) : columnNames;
  },
});
