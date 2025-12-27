import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../../';

export const pcloudDeleteFile = createAction({
  auth: pcloudAuth,
  name: 'delete_pcloud_file',
  description: 'Delete a file from pCloud',
  displayName: 'Delete File',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'The ID of the file to delete',
      required: true,
    }),
  },
  async run(context) {
    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pcloud.com/deletefile',
      queryParams: {
        fileid: context.propsValue.fileId.toString(),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    if (result.body.result !== 0) {
      throw new Error(`Failed to delete file: ${result.body.error}`);
    }

    return result.body.metadata;
  },
});
