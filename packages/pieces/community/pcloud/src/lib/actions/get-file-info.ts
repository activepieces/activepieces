import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';

export const pcloudGetFileInfo = createAction({
  auth: pcloudAuth,
  name: 'get_pcloud_file_info',
  description: 'Get information about a file',
  displayName: 'Get File Info',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description:
        'The ID of the file to get information about.',
      required: true,
    }),
  },
  async run(context) {
    const params = new URLSearchParams({
      fileid: context.propsValue.fileId.toString(),
    });

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.pcloud.com/stat?${params.toString()}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
