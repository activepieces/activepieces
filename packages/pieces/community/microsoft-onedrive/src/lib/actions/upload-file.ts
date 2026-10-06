import { Readable } from 'node:stream';
import { buffer as readableToBuffer } from 'node:stream/consumers';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  streamUtils,
} from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import mime from 'mime-types';
import { oneDriveCommon } from '../common/common';
import { getCloudProp } from '../common/microsoft-cloud';
import { uploadFileOutputSchema } from '../output-schemas';

export const uploadFile = createAction({
  auth: oneDriveAuth,
  name: 'upload_onedrive_file',
  classification: 'WRITE',
  description: 'Upload a file to your Microsoft OneDrive with chunked upload if the file is larger than 4MiB',
  audience: 'human',
  aiMetadata: { description: 'Upload a file to a Microsoft OneDrive folder, given a target file name, the file content, and an optional parent folder (defaults to the drive root). Large files (over 4MiB) are uploaded in chunks automatically. Idempotent: uploading the same file name to the same folder overwrites the existing item rather than creating a duplicate.', idempotent: true },
  displayName: 'Upload file',
  outputSchema: uploadFileOutputSchema,
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
      streaming: true,
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
      : 'application/octet-stream';
    const encodedFilename = encodeURIComponent(context.propsValue.fileName);
    const parentId = context.propsValue.parentId ?? 'root';
    const cloud = getCloudProp(context.auth);
    const baseUrl = oneDriveCommon.getBaseUrl(cloud);

    let { body, size: fileSize } = streamUtils.toStreamingBody(fileData);
    if (fileSize == null) {
      const buffered = await readableToBuffer(body);
      fileSize = buffered.length;
      body = Readable.from(buffered);
    }

    if (fileSize <= 4 * 1024 * 1024) {
      const result = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: `${baseUrl}/items/${parentId}:/${encodedFilename}:/content`,
        body,
        headers: {
          'Content-Type': mimeType,
          'Content-length': fileSize.toString(),
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
      });

      return result.body;
    } else {
      const session = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${baseUrl}/items/${parentId}:/${encodedFilename}:/createUploadSession`,
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
      let result;
      for await (const chunk of streamUtils.readChunks({ readable: body, chunkSize: CHUNK_SIZE })) {
        const end = start + chunk.length - 1;

        result = await httpClient.sendRequest({
          method: HttpMethod.PUT,
          url: uploadUrl,
          body: chunk,
          headers: {
            'Content-Length': chunk.length.toString(),
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          },
        });

        start += chunk.length;
      }

      return result?.body;
    }
  },
});

const CHUNK_SIZE = 10485760;
