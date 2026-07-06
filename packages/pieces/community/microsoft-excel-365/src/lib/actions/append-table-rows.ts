import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';
import { excelCommon } from '../common/common';

export const appendTableRowsAction = createAction({
  auth: excelAuth,
  name: 'append_table_rows',
  description: 'Append rows to a table',
  audience: 'both',
  aiMetadata: { description: 'Append a row of values to a defined Excel table (by table id), mapped to the table columns. Use for structured tables that auto-expand; for a plain worksheet without a table use Append Multiple Rows. Not idempotent — re-running adds duplicate rows.', idempotent: false },
  displayName: 'Append Rows to a Table',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    tableId: commonProps.tableId,
    values: excelCommon.tableValues,
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId, worksheetId, tableId } = propsValue;
    const valuesToAppend = [Object.values(propsValue['values'])];
    const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const client = createMSGraphClient(auth['access_token'], cloud);
    const response = await client
      .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/rows`)
      .post({ values: valuesToAppend });

    return response;
  },
});
