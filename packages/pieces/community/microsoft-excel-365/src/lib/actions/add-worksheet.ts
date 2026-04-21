import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import {} from '@activepieces/pieces-common';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const addWorksheetAction = createAction({
  auth: excelAuth,
  name: 'add_worksheet',
  description: 'Add a worksheet to a workbook',
  displayName: 'Add a Worksheet to a Workbook',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheet_name: Property.ShortText({
      displayName: 'Worksheet Name',
      description: 'The name of the new worksheet',
      required: false,
      defaultValue: 'Sheet',
    }),
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId } = propsValue;
    const worksheet_name = propsValue['worksheet_name'];
    const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const client = createMSGraphClient(auth['access_token'], cloud);

    const body = worksheet_name ? { name: worksheet_name } : {};

    const response = await client
      .api(`${drivePath}/items/${workbookId}/workbook/worksheets`)
      .post(body);

    return response;
  },
});
