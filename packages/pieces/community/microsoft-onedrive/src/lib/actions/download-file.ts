import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { oneDriveAuth } from '../../';
import { oneDriveCommon } from '../common/common';

export const downloadFile = createAction({
  auth: oneDriveAuth,
  name: 'download_file',
  description: 'Download a file from your Microsoft OneDrive',
  displayName: 'Download file',
  props: {
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'The ID of the file to download',
      required: true,
    }),
  },
  async run(context) {
    const fileId = context.propsValue.fileId;

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${oneDriveCommon.baseUrl}/items/${fileId}/content`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    const desiredHeaders = [
      'content-length',
      'content-type',
      'content-location',
      'expires',
    ];
    const filteredHeaders: any = {};

    if (result.headers) {
      for (const key of desiredHeaders) {
        filteredHeaders[key] = result.headers[key];
      }
    }

    return filteredHeaders;
  },
});
