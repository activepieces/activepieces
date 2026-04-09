import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const getRangeAction = createAction({
  auth: excelAuth,
  name: 'get_range',
  displayName: 'Get Cells in Range',
  description: 'Retrieve the values in a given cell range (e.g., “A1:C10”).',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    range: Property.ShortText({
      displayName: 'Range',
      description:
        'The range of cells to retrieve, in A1 notation (e.g., "A1:C10").',
      required: true
    })
  },
  async run(context) {
    const { storageSource, siteId, documentId, workbookId, worksheetId, range } = context.propsValue;
    const { access_token } = context.auth;
    const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    if (!/^[A-Z]+[1-9][0-9]*(:[A-Z]+[1-9][0-9]*)?$/.test(range as string)) {
      throw new Error(
        'Invalid range format. Please use A1 notation (e.g., "A1" or "A1:C5").'
      );
    }

    const client = createMSGraphClient(access_token, cloud);
    const response = await client
      .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${range}')`)
      .get();

    // The response body contains the workbookRange object with details
    // like values, text, formulas, rowCount, etc.
    return response;
  }
});
