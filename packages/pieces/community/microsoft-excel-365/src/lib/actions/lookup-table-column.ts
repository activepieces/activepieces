import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';
import { excelCommon } from '../common/common';

export const lookupTableColumnAction = createAction({
  auth: excelAuth,
  name: 'lookup_table_column',
  description: 'Lookup a value in a table column in a worksheet',
  displayName: 'Lookup Table Column',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    tableId: commonProps.tableId,
    lookup_column: Property.ShortText({
      displayName: 'Lookup Column',
      description: 'The column name to lookup the value in',
      required: true,
    }),
    lookup_value: Property.ShortText({
      displayName: 'Lookup Value',
      description: 'The value to lookup',
      required: true,
    }),
    return_all_matches: Property.Checkbox({
      displayName: 'Return All Matches',
      description: 'If checked, all matching rows will be returned',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId, worksheetId, tableId } = propsValue;
    const lookupColumn = propsValue['lookup_column'];
    const lookupValue = propsValue['lookup_value'];
    const returnAllMatches = propsValue['return_all_matches'];
    const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const client = createMSGraphClient(auth['access_token'], cloud);

    const rowsResponse = await client
      .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/rows`)
      .get();

    const columnsResponse = await client
      .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/columns`)
      .get();

    const columns = columnsResponse.value;
    const columnIndex = columns.findIndex(
      (column: any) => column.name === lookupColumn
    );

    if (columnIndex === -1) {
      throw new Error(`Column "${lookupColumn}" not found in the table.`);
    }

    const rows = rowsResponse.value;
    const matchedRows = rows.filter(
      (row: any) => row.values[0][columnIndex] === lookupValue
    );

    const matchedValues = matchedRows.map(
      (row: { values: any[] }) => row.values[0]
    );

    if (returnAllMatches) {
      return matchedValues;
    } else {
      return matchedValues[0] || null;
    }
  },
});
