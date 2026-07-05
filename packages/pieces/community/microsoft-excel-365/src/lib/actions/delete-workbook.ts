import { createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const deleteWorkbookAction = createAction({
  auth: excelAuth,
  name: 'delete_workbook',
  description: 'Delete a workbook',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete an entire Excel workbook file from OneDrive or a SharePoint document library. Pick this to remove a whole file, not a single sheet (use Delete Worksheet for that). Destructive and irreversible; idempotent by stable workbook id, so re-running after deletion has no further effect.', idempotent: true },
  displayName: 'Delete Workbook',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId } = propsValue;
    const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const client = createMSGraphClient(auth['access_token'], cloud);
    await client.api(`${drivePath}/items/${workbookId}`).delete();
    return { success: true };
  },
});
