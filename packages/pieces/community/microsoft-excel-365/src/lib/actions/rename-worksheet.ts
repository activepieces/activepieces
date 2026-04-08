import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

const namingRules = `
The new name for the worksheet. The name must adhere to the following rules:
- Cannot be blank.
- Cannot exceed 31 characters.
- Must not contain any of the following characters: \`/\`, \`\\\`, \`?\`, \`*\`, \`:\`, \`[\`, \`]\`.
- The name "History" is reserved by Excel and cannot be used.
`;

export const renameWorksheetAction = createAction({
  auth: excelAuth,
  name: 'rename_worksheet',
  displayName: 'Rename Worksheet',
  description: 'Change the name of an existing worksheet.',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    new_name: Property.ShortText({
      displayName: 'New Worksheet Name',
      description: namingRules,
      required: true
    })
  },
  async run(context) {
    const { storageSource, siteId, documentId, workbookId, worksheetId, new_name } = context.propsValue;
    const { access_token } = context.auth;
    const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    // The worksheet_id prop from excelCommon returns the worksheet's current name,
    // which can be used to identify it in the API URL.
    const client = createMSGraphClient(access_token, cloud);
    const response = await client
      .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}`)
      .patch({ name: new_name });

    return response;
  }
});
