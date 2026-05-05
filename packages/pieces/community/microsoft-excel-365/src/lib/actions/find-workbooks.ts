import { excelAuth } from '../auth';
import { createAction, OAuth2PropertyValue, Property } from "@activepieces/pieces-framework";
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const findWorkbookAction = createAction({
  auth: excelAuth,
  name: 'find-workbook',
  displayName: 'Find Workbook',
  description: 'Finds an existing workbook by name.',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Excel File name to search for without extension.',
      required: true
    })
  },
  async run(context) {
    const { storageSource, siteId, documentId, fileName } = context.propsValue;
    const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const fileNameWithExtension = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;

    const client = createMSGraphClient(context.auth.access_token, cloud);
    const response = await client
      .api(`${drivePath}/items/root/search(q='.xlsx')`)
      .select('id,name,lastModifiedDateTime,parentReference')
      .get();

    const result = response.value.filter((item: { name: string }) => item.name === fileNameWithExtension);



    return {
      found: result.length > 0,
      data: result
    }


  }
})