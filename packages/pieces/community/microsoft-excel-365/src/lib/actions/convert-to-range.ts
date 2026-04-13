import { createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';
import { excelAuth } from '../auth';

export const convertToRangeAction = createAction({
  auth: excelAuth,
  name: 'convert_to_range',
  description: 'Converts a table to a range',
  displayName: 'Convert to Range',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    tableId: commonProps.tableId,
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId, worksheetId, tableId } = propsValue;
    const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const client = createMSGraphClient(auth['access_token'], cloud);
    const response = await client
      .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/convertToRange`)
      .post({});

    return response;
  },
});
