import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';

export const downloadFile = createAction({
  auth: pcloudAuth,
  name: 'pcloud_download_file',
  displayName: 'Download File Content',
  description: 'Get a download link for a file stored in pCloud.',
  props: {
    file_id: Property.Number({
      displayName: 'File ID',
      description: 'The ID of the file to download.',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pcloud.com/getfilelink',
      queryParams: {
        fileid: context.propsValue.file_id.toString(),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    if (response.body.result !== 0) {
      throw new Error(`pCloud error: ${response.body.error}`);
    }

    const host = response.body.hosts[0];
    const path = response.body.path;
    return {
      downloadUrl: `https://${host}${path}`,
      expires: response.body.expires,
    };
  },
});
