import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const clearWorksheetAction = createAction({
  auth: excelAuth,
  name: 'clear_worksheet',
  description: 'Clear a worksheet',
  displayName: 'Clear Worksheet',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    range: Property.ShortText({
      displayName: 'Range',
      description:
        'The range in A1 notation (e.g., A2:B2) to clear in the worksheet, if not provided, clear the entire worksheet',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId, worksheetId } = propsValue;
    const range = propsValue['range'];
    const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    let url = `${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/`;

    // If range is not provided, clear the entire worksheet
    if (!range) {
      url += 'usedRange(valuesOnly=true)/clear';
    } else {
      url += `range(address = '${range}')/clear`;
    }

    const client = createMSGraphClient(auth['access_token'], cloud);
    await client.api(url).post({ applyTo: 'contents' });
    return {};
  },
});
