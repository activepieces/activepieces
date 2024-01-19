import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { oneDriveAuth } from '../../';
import mime from 'mime-types';
import { oneDriveCommon } from '../common/common';

export const uploadFile = createAction({
  auth: oneDriveAuth,
  name: 'upload_onedrive_file',
  description: 'Upload a file to your Microsoft OneDrive',
  displayName: 'Upload file',
  props: {
    fileName: Property.ShortText({
      displayName: 'File name',
      description: 'The name the file should be saved as (e.g. file.txt)',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file URL or base64 to upload',
      required: true,
    }),
    parentId: oneDriveCommon.parentFolder,
  },
  async run(context) {
    const fileData = context.propsValue.file;
    const mimeTypeLookup = mime.lookup(
      fileData.extension ? fileData.extension : ''
    );
    const mimeType = mimeTypeLookup
      ? mimeTypeLookup
      : 'application/octet-stream'; // Fallback to a default MIME type
    const encodedFilename = encodeURIComponent(context.propsValue.fileName);
    const parentId = context.propsValue.parentId ?? 'root';

    const fileBuffer = Buffer.from(fileData.base64, 'base64');

    const result = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${oneDriveCommon.baseUrl}/items/${parentId}:/${encodedFilename}:/content`,
      body: fileBuffer,
      headers: {
        'Content-Type': mimeType,
        'Content-length': fileBuffer.length.toString(),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
