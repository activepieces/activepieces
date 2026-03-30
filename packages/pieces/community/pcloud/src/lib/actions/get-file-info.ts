import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';

export const pcloudGetFileInfo = createAction({
  auth: pcloudAuth,
  name: 'get_pcloud_file_info',
  displayName: 'Get File Info',
  description: 'Get metadata information about a file',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'The ID of the file',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The path to the file (e.g., /folder/file.txt). Use fileId or path.',
      required: false,
    }),
  },
  async run(context) {
    const params: Record<string, any> = {};
    
    if (context.propsValue.fileId) {
      params.fileid = context.propsValue.fileId;
    } else if (context.propsValue.path) {
      params.path = context.propsValue.path;
    } else {
      throw new Error('Either fileId or path must be provided');
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pcloud.com/stat',
      queryParams: params,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    if (result.body.result !== 0) {
      throw new Error(`Failed to get file info: ${JSON.stringify(result.body)}`);
    }

    return result.body;
  },
});
