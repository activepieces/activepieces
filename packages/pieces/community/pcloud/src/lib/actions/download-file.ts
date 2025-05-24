import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { pcloudAuth } from '../../index';

export const downloadFileAction = createAction({
  auth: pcloudAuth,
  name: 'download_file',
  displayName: 'Download File',
  description: 'Download a file from pCloud',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'The ID of the file to download',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const response = await makeRequest(
      (auth as { access_token: string }).access_token,
      HttpMethod.GET,
      '/getfilelink',
      null,
      {
        fileid: propsValue.fileId.toString(),
        forcedownload: '1',
      }
    );

    if (response && response.path && response.hosts && response.hosts.length > 0) {
      const downloadUrl = `https://${response.hosts[0]}${response.path}`;

      // Fetch the actual file content
      const fileResponse = await fetch(downloadUrl);
      const fileData = await fileResponse.arrayBuffer();
      const base64Content = Buffer.from(fileData).toString('base64');

      return {
        url: downloadUrl,
        content: base64Content,
      };
    }

    return response;
  },
});
