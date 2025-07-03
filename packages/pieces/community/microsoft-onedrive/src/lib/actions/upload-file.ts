import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { oneDriveAuth } from '../../';
import mime from 'mime-types';
import { oneDriveCommon } from '../common/common';

const CHUNK_SIZE = 10485760; // Use 10MiB per chunk

export const uploadFile = createAction({
  auth: oneDriveAuth,
  name: 'upload_onedrive_file',
  description: 'Upload a file to your Microsoft OneDrive with chunked upload if the file is larger than 4MiB',
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
    markdown:oneDriveCommon.parentFolderInfo,
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

    if (fileData.data.length <= 4 * 1024 * 1024) {
      // If file is smaller than 4MiB, use simple upload
      const base64Data = Buffer.from(fileData.base64, 'base64');
      const result = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: `${oneDriveCommon.baseUrl}/items/${parentId}:/${encodedFilename}:/content`,
        body: base64Data,
        headers: {
          'Content-Type': mimeType,
          'Content-length': base64Data.length.toString(),
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
      });

      return result.body;
    } else {
      // For files larger than 4MiB, use chunked upload
      const session = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${oneDriveCommon.baseUrl}/items/${parentId}:/${encodedFilename}:/createUploadSession`,
        body: {
          item: {
            '@microsoft.graph.conflictBehavior': 'replace',
            name: context.propsValue.fileName,
          },
        },
        headers: {
          'Content-Type': 'application/json',
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
      });

      const uploadUrl = session.body.uploadUrl;
      let start = 0;
      let end = CHUNK_SIZE - 1;
      const fileSize = fileData.data.length;
      let result;
      while (start < fileSize) {
        if (end >= fileSize) {
          end = fileSize - 1;
        }

        const chunk = fileData.data.slice(start, end + 1);

        result = await httpClient.sendRequest({
          method: HttpMethod.PUT,
          url: uploadUrl,
          body: chunk,
          headers: {
            'Content-Length': chunk.length.toString(),
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          },
        });

        start += CHUNK_SIZE;
        end += CHUNK_SIZE;
      }

      return result?.body;
    }
  },
});