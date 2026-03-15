import { createAction } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const deleteWorkbookAction = createAction({
  auth: excelAuth,
  name: 'delete_workbook',
  description: 'Delete a workbook',
  displayName: 'Delete Workbook',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId } = propsValue;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const client = createMSGraphClient(auth['access_token']);
    await client.api(`${drivePath}/items/${workbookId}`).delete();
    return { success: true };
  },
});
