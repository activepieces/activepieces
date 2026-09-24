import { Readable } from 'node:stream';
import { buffer as readableToBuffer } from 'node:stream/consumers';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, streamUtils } from '@activepieces/pieces-common';
import mime from 'mime-types';
import { oneDriveAuth } from '../auth';
import { GraphDriveItem, oneDriveApi } from '../common/graph-api';
import { onedriveItemOutputSchema } from '../output-schemas';

export const onedriveUploadFile = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_upload_file',
  displayName: 'Upload File',
  description: 'Upload a file to a OneDrive folder, replacing any file with the same name.',
  audience: 'ai',
  outputSchema: onedriveItemOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads a file (URL or base64) into a OneDrive folder under the given name; files over 4 MiB are sent in chunks automatically. Use Create Text File to write plain text without a file object, and Replace File Content to overwrite a known item by ID. The destination folder must already exist (create it with Create Folder); uploading the same name to the same folder overwrites the existing file, so retries are safe.',
    idempotent: true,
  },
  props: {
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description:
        'The ID of the destination folder, from Search Files and Folders or List Folder Contents. Leave empty for the drive root.',
      required: false,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'The name to save the file as, including its extension, e.g. `report.pdf`.',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file URL or base64 content to upload.',
      required: true,
      streaming: true,
    }),
  },
  async run(context) {
    const { folderId, fileName, file } = context.propsValue;
    const name = fileName.trim();
    if (!name) {
      throw new Error('File Name cannot be empty.');
    }
    const mimeType = mime.lookup(file.extension ?? '') || 'application/octet-stream';
    let { body, size } = streamUtils.toStreamingBody(file);
    if (size == null) {
      const buffered = await readableToBuffer(body);
      size = buffered.length;
      body = Readable.from(buffered);
    }
    const targetPath = `${oneDriveApi.folderPath({ folderId })}:/${encodeURIComponent(name)}:`;
    const item = await uploadContent({
      auth: context.auth,
      targetPath,
      name,
      body,
      size,
      mimeType,
    });
    return oneDriveApi.toItem(item);
  },
});

async function uploadContent({
  auth,
  targetPath,
  name,
  body,
  size,
  mimeType,
}: {
  auth: OAuth2PropertyValue;
  targetPath: string;
  name: string;
  body: Readable;
  size: number;
  mimeType: string;
}): Promise<GraphDriveItem> {
  if (size <= SIMPLE_UPLOAD_LIMIT) {
    return oneDriveApi.request<GraphDriveItem>({
      auth,
      method: HttpMethod.PUT,
      path: `${targetPath}/content`,
      body,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': size.toString(),
      },
    });
  }
  const session = await oneDriveApi.request<{ uploadUrl: string }>({
    auth,
    method: HttpMethod.POST,
    path: `${targetPath}/createUploadSession`,
    body: {
      item: {
        '@microsoft.graph.conflictBehavior': 'replace',
        name,
      },
    },
    headers: { 'Content-Type': 'application/json' },
  });
  let start = 0;
  let result: GraphDriveItem | undefined;
  for await (const chunk of streamUtils.readChunks({ readable: body, chunkSize: CHUNK_SIZE })) {
    const end = start + chunk.length - 1;
    try {
      const response = await httpClient.sendRequest<GraphDriveItem>({
        method: HttpMethod.PUT,
        url: session.uploadUrl,
        body: chunk,
        headers: {
          'Content-Length': chunk.length.toString(),
          'Content-Range': `bytes ${start}-${end}/${size}`,
        },
      });
      result = response.body;
    } catch (error) {
      throw new Error(oneDriveApi.describeError(error));
    }
    start += chunk.length;
  }
  if (!result?.id) {
    throw new Error('The upload session finished without returning the uploaded file.');
  }
  return result;
}

const SIMPLE_UPLOAD_LIMIT = 4 * 1024 * 1024;
const CHUNK_SIZE = 10485760;
