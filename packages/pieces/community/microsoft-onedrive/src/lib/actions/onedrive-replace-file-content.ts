import { Readable } from 'node:stream';
import { buffer as readableToBuffer } from 'node:stream/consumers';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, streamUtils } from '@activepieces/pieces-common';
import mime from 'mime-types';
import { oneDriveAuth } from '../auth';
import { GraphDriveItem, oneDriveApi } from '../common/graph-api';
import { onedriveItemOutputSchema } from '../output-schemas';

const SIMPLE_UPLOAD_LIMIT = 4 * 1024 * 1024;
const CHUNK_SIZE = 10485760;

export const onedriveReplaceFileContent = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_replace_file_content',
  displayName: 'Replace File Content',
  description: 'Overwrite the content of an existing OneDrive file, keeping its ID and sharing links.',
  audience: 'ai',
  outputSchema: onedriveItemOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Overwrites the content of an existing file, identified by Item ID or Path, and keeps its ID, name and sharing links; files over 4 MiB are sent in chunks. Use Upload File to add a new file by folder and name. The item must already exist and be a file (not a folder); get its ID from Search Files and Folders or List Folder Contents. Re-running with the same content converges on the same state.',
    idempotent: true,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description:
        'The ID of the file to overwrite, from Search Files and Folders or List Folder Contents. Provide either this or Path.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The file path relative to the drive root, e.g. `Documents/report.docx`. Provide either this or Item ID.',
      required: false,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The new content, as a file URL or base64.',
      required: true,
      streaming: true,
    }),
  },
  async run(context) {
    const { itemId, path, file } = context.propsValue;
    const existing = await oneDriveApi.request<GraphDriveItem>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: oneDriveApi.itemPath({ itemId, path }),
      queryParams: { $select: 'id,name,file,folder,package' },
    });
    if (!existing.file) {
      throw new Error(`"${existing.name}" is not a file, so its content cannot be replaced.`);
    }
    const mimeType = mime.lookup(file.extension ?? '') || existing.file.mimeType || 'application/octet-stream';
    let { body, size } = streamUtils.toStreamingBody(file);
    if (size == null) {
      const buffered = await readableToBuffer(body);
      size = buffered.length;
      body = Readable.from(buffered);
    }
    const item = await replaceContent({
      auth: context.auth,
      targetPath: oneDriveApi.itemPath({ itemId: existing.id }),
      body,
      size,
      mimeType,
    });
    return oneDriveApi.toItem(item);
  },
});

async function replaceContent({
  auth,
  targetPath,
  body,
  size,
  mimeType,
}: {
  auth: OAuth2PropertyValue;
  targetPath: string;
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
    body: { item: { '@microsoft.graph.conflictBehavior': 'replace' } },
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
    throw new Error('The upload session finished without returning the updated file.');
  }
  return result;
}
