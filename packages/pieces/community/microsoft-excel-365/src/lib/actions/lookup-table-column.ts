import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const lookupTableColumnAction = createAction({
  auth: excelAuth,
  name: 'lookup_table_column',
  classification: 'SEARCH',
  description: 'Look up a value in a table column named by its header.',
  audience: 'both',
  aiMetadata: { description: 'Find rows in a defined Excel table where a named column exactly equals a given value, returning the first match by default or all matches when Return All Matches is enabled. Use to look up table records by a key; throws if the named column does not exist. Read-only and idempotent.', idempotent: true },
  displayName: 'Look Up Table Column',
  propertyGroups: [
    {
      key: 'workbook',
      display: 'section',
      label: 'Workbook',
      icon: 'file',
      props: ['storageSource', 'siteId', 'documentId', 'workbookId', 'worksheetId', 'tableId'],
    },
    {
      key: 'search',
      display: 'section',
      label: 'Search',
      icon: 'filter',
      props: ['lookup_column', 'lookup_value', 'return_all_matches'],
    },
  ],
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    tableId: commonProps.tableId,
    lookup_column: Property.ShortText({
      displayName: 'Column Name',
      description: 'Exact header text.',
      placeholder: 'Email',
      width: 'half',
      required: true,
    }),
    lookup_value: Property.ShortText({
      displayName: 'Value',
      description: 'Rows whose cell equals this are returned.',
      placeholder: 'jane@example.com',
      width: 'half',
      required: true,
    }),
    return_all_matches: Property.Checkbox({
      displayName: 'Return All Matches',
      description: 'Off returns the first match only.',
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
      (column: { name: string }) => column.name === lookupColumn
    );

    if (columnIndex === -1) {
      throw new Error(`Column "${lookupColumn}" not found in the table.`);
    }

    const rows = rowsResponse.value;
    const matchedRows = rows.filter((row: { values: unknown[][] }) => {
      const cell = row.values[0][columnIndex];
      return cell === lookupValue || String(cell) === lookupValue;
    });

    const matchedValues = matchedRows.map(
      (row: { values: unknown[][] }) => row.values[0]
    );

    if (returnAllMatches) {
      return matchedValues;
    } else {
      return matchedValues[0] || null;
    }
  },
});
