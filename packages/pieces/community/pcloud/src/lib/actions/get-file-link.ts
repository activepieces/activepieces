import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../../';

export const pcloudGetFileLink = createAction({
  auth: pcloudAuth,
  name: 'get_pcloud_file_link',
  description: 'Get a download link for a file in pCloud',
  displayName: 'Get File Link',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'The ID of the file',
      required: true,
    }),
  },
  async run(context) {
    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pcloud.com/getfilelink',
      queryParams: {
        fileid: context.propsValue.fileId.toString(),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    if (result.body.result !== 0) {
      throw new Error(`Failed to get file link: ${result.body.error}`);
    }

    const downloadUrl = `https://${result.body.hosts[0]}${result.body.path}`;

    return {
      downloadUrl,
      expires: result.body.expires,
      size: result.body.size,
      hosts: result.body.hosts,
    };
  },
});
