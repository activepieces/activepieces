import { createAction, MarkdownVariant, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const deleteWorksheetAction = createAction({
  auth: excelAuth,
  name: 'delete_worksheet',
  classification: 'DESTRUCTIVE',
  description: 'Delete a worksheet in a workbook',
  audience: 'both',
  aiMetadata: { description: 'Delete a single worksheet (tab) from a workbook, leaving the rest of the file intact. Pick this to remove one sheet rather than the whole file (use Delete Workbook for the entire file). Destructive; idempotent by stable worksheet id, so re-running after deletion has no further effect.', idempotent: true },
  displayName: 'Delete Worksheet',
  propertyGroups: [
    {
      key: 'workbook',
      display: 'section',
      label: 'Workbook',
      icon: 'file',
      props: ['storageSource', 'siteId', 'documentId', 'workbookId', 'worksheetId', 'delete_warning'],
    },
  ],
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    delete_warning: Property.MarkDown({
      value: 'The worksheet and its data are deleted. This cannot be undone.',
      variant: MarkdownVariant.WARNING,
    }),
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId, worksheetId } = propsValue;
    const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const client = createMSGraphClient(auth['access_token'], cloud);
    await client.api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}`).delete();
    return { success: true };
  },
});
