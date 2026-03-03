import { excelAuth } from '../auth';
import { createAction, Property } from "@activepieces/pieces-framework";
import { commonProps } from '../common/props';
import { getDrivePath } from '../common/helpers';
import { AuthenticationType, httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

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
    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const fileNameWithExtension = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${drivePath}/items/root/search(q='.xlsx')?$select=id,name,lastModifiedDateTime,parentReference`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token
      }
    }

    const response = await httpClient.sendRequest<{ value: Array<{ id: string, name: string }> }>(request);

    const result = response.body.value.filter(item => item.name === fileNameWithExtension);



    return {
      found: result.length > 0,
      data: result
    }


  }
})