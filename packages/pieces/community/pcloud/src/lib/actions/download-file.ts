import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../../';

export const pcloudDownloadFile = createAction({
  auth: pcloudAuth,
  name: 'download_pcloud_file',
  description: 'Download a file from pCloud',
  displayName: 'Download File',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'The ID of the file to download',
      required: true,
    }),
  },
  async run(context) {
    // First get the file link
    const linkResult = await httpClient.sendRequest({
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

    if (linkResult.body.result !== 0) {
      throw new Error(`Failed to get file link: ${linkResult.body.error}`);
    }

    const downloadUrl = `https://${linkResult.body.hosts[0]}${linkResult.body.path}`;

    // Download the file
    const fileResult = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: downloadUrl,
    });

    return {
      filename: linkResult.body.path.split('/').pop(),
      data: fileResult.body,
      size: linkResult.body.size,
    };
  },
});
