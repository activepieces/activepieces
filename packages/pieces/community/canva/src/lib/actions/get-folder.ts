import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { canvaCommon } from '../common';

export const getFolder = createAction({
  auth: canvaAuth,
  name: 'get_folder',
  displayName: 'Get Folder',
  description: 'Get folder details',
  props: {
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'The folder identifier',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const folderId = context.propsValue.folder_id;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${canvaCommon.baseUrl}/${canvaCommon.folders}/${folderId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
    };

    const response = await httpClient.sendRequest(request);

    return {
      success: true,
      folder: response.body,
    };
  },
});
