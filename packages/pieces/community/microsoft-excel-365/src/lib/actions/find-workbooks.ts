import { excelAuth } from '../../index';
import { createAction, Property } from "@activepieces/pieces-framework";
import { excelCommon } from '../common/common';
import { AuthenticationType, httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

export const findWorkbookAction = createAction({
  auth: excelAuth,
  name: 'find-workbook',
  displayName: 'Find Workbook',
  description: 'Finds an existing workbook by name.',
  props: {
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Excel File name to search for without extension.',
      required: true
    })
  },
  async run(context) {
    const { fileName } = context.propsValue;
    const fileNameWithExtension = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${excelCommon.baseUrl}/items/root/search(q='.xlsx')?$select=id,name,lastModifiedDateTime,parentReference`,
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