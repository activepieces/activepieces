import { createAction, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';
import { 
  httpClient, 
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const createWorkbook = createAction({
  auth: excelAuth,
  name: 'createWorkbook',
  displayName: 'Create Workbook',
  description: 'Create a new workbook at the specified location',
  props: {
    name: Property.ShortText({
      displayName: "Name",
      description: "The name of the new workbook",
      required: true
    }),
    parentFolder: excelCommon.parent_folder
  },
  async run(context) {
    const { name, parentFolder } = context.propsValue

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${excelCommon.baseUrl}/${parentFolder === 'root' ? '' : 'items/'}${parentFolder}/children`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth['access_token'],
      },
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        file: {},
        name: name.endsWith('.xlsx') ? name : `${name}.xlsx`,
        '@microsoft.graph.conflictBehavior': 'rename'
      }
    })

    return response
  }
});
