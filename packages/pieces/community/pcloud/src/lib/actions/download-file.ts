import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';

export const pcloudDownloadFile = createAction({
  auth: pcloudAuth,
  name: 'download_pcloud_file',
  description: 'Download a file from pCloud',
  displayName: 'Download File',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description:
        'The ID of the file to download.',
      required: true,
    }),
  },
  async run(context) {
    const params = new URLSearchParams({
      fileid: context.propsValue.fileId.toString(),
    });

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.pcloud.com/getfilelink?${params.toString()}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    // The response contains aHosts with download links
    const response = result.body as { hosts: string[]; path: string; name: string };
    
    if (response.hosts && response.hosts.length > 0) {
      const downloadUrl = `https://${response.hosts[0]}${response.path}`;
      
      // Fetch the actual file content
      const fileResult = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: downloadUrl,
        responseType: 'arraybuffer',
      });

      return {
        file: await context.files.write({
          fileName: response.name,
          data: Buffer.from(fileResult.body),
        }),
        metadata: {
          fileId: context.propsValue.fileId,
          name: response.name,
          path: response.path,
        },
      };
    }

    return result.body;
  },
});
