import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';

export const pcloudDeleteFile = createAction({
  auth: pcloudAuth,
  name: 'delete_pcloud_file',
  description: 'Delete a file',
  displayName: 'Delete File',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description:
        'The ID of the file to delete.',
      required: true,
    }),
  },
  async run(context) {
    const params = new URLSearchParams({
      fileid: context.propsValue.fileId.toString(),
    });

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.pcloud.com/deletefile?${params.toString()}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
