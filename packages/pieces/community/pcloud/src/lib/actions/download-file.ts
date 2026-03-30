import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';

export const pcloudDownloadFile = createAction({
  auth: pcloudAuth,
  name: 'download_pcloud_file',
  displayName: 'Download File',
  description: 'Download a file from pCloud',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'The ID of the file to download',
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

    // First, get the download link
    const linkResult = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pcloud.com/getfilelink',
      queryParams: params,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    if (linkResult.body.result !== 0) {
      throw new Error(`Failed to get download link: ${JSON.stringify(linkResult.body)}`);
    }

    // Download the file content
    const downloadUrl = linkResult.body.hosts[0] + linkResult.body.path;
    const downloadResult = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: downloadUrl,
      responseType: 'arraybuffer',
    });

    return {
      success: true,
      file: downloadResult.body,
      metadata: linkResult.body,
    };
  },
});
