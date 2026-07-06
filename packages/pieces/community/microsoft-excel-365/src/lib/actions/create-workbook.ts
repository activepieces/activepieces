import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const createWorkbook = createAction({
  auth: excelAuth,
  name: 'createWorkbook',
  displayName: 'Create Workbook',
  description: 'Create a new workbook at the specified location',
  audience: 'both',
  aiMetadata: { description: 'Create a new, empty .xlsx workbook file in OneDrive or a SharePoint document library. Use to provision a fresh spreadsheet before adding worksheets or data. Not idempotent — name conflicts are auto-renamed, so re-running produces an additional file rather than reusing an existing one.', idempotent: false },
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    name: Property.ShortText({
      displayName: "Name",
      description: "The name of the new workbook",
      required: true
    }),
  },
  async run(context) {
    const { storageSource, siteId, documentId, name } = context.propsValue;
    const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const client = createMSGraphClient(context.auth['access_token'], cloud);
    const response = await client
      .api(`${drivePath}/root/children`)
      .post({
        file: {},
        name: name.endsWith('.xlsx') ? name : `${name}.xlsx`,
        '@microsoft.graph.conflictBehavior': 'rename',
      });

    return response;
  }
});
