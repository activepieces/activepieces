import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';
import { pcloudCommon } from '../common';

export const pcloudDownloadFile = createAction({
  auth: pcloudAuth,
  name: 'download_pcloud_file',
  description: 'Download file content from pCloud',
  displayName: 'Download File Content',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'The ID of the file to download',
      required: true,
    }),
  },
  async run(context) {
    const linkResult = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${pcloudCommon.baseUrl}/getfilelink`,
      queryParams: {
        fileid: context.propsValue.fileId.toString(),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    const body = linkResult.body as {
      hosts: string[];
      path: string;
    };

    if (!body.hosts || !body.path) {
      throw new Error(
        'Failed to get download link: ' + JSON.stringify(linkResult.body)
      );
    }

    const downloadUrl = 'https://' + body.hosts[0] + body.path;

    const fileResult = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: downloadUrl,
    });

    return {
      downloadUrl,
      fileName: body.path.split('/').pop(),
      data: fileResult.body,
    };
  },
});
