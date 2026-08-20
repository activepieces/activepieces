import { Readable } from 'node:stream';
import { buffer as readableToBuffer } from 'node:stream/consumers';
import { microsoftSharePointAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType, HttpResponse, streamUtils } from '@activepieces/pieces-common';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { microsoftSharePointCommon } from '../common';
import { Client } from '@microsoft/microsoft-graph-client';

const SIMPLE_UPLOAD_LIMIT = 250 * 1024 * 1024;
const CHUNK_SIZE = 10 * 1024 * 1024;

export const uploadFile = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_upload_file',
  displayName: 'Upload File',
  description: 'Uploads a new file at path you specify.',
  audience: 'both',
  aiMetadata: {
    description: 'Uploads file content to a SharePoint document library (drive), placing it under a parent folder path with the file name you specify. Files over 250 MB are uploaded in chunks automatically. Use to push a file (from a prior step or URL) into a site. Idempotent on the target path: uploading the same name to the same folder replaces the existing file rather than creating a duplicate.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointCommon.siteId,
    driveId: microsoftSharePointCommon.driveId,
    file: Property.File({
      displayName: "File",
      description: "The file or url you want to upload",
      required: true,
      streaming: true,
    }),
    parentFolder: Property.ShortText({
      displayName: 'Parent Folder',
      description: `Parent folder, like "/demo/" or "/docs/assignment/".Leave it default if you want to create folder at the root (**CHANGE THIS BACK//**) level.`,
      required: true,
      defaultValue: '/',
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      required: true,
    }),
  },
  async run(context) {
    const { siteId, driveId, file, parentFolder, fileName } = context.propsValue;

    const cloud = context.auth.props?.['cloud'] as string | undefined;
    const baseUrl = getGraphBaseUrl(cloud);
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
      baseUrl,
    });

    const parentIdResponse = await client.api(`/sites/${siteId}/drives/${driveId}/root:${parentFolder}`).get()
    const parentId = parentIdResponse.id ?? "test";
    const itemPath = `/sites/${siteId}/drives/${driveId}/items/${parentId}:/${fileName}`;

    // Chunked upload needs the total size upfront for the Content-Range header.
    // When the source doesn't report a size, buffer once and use its length —
    // same behaviour as before streaming — then re-wrap so both paths stream.
    let fileSize = file.size;
    let body = file.body;
    if (fileSize == null) {
      const buffered = await readableToBuffer(file.body);
      fileSize = buffered.length;
      body = Readable.from(buffered);
    }

    // The simple PUT is one request but Graph rejects a body over 250 MB, so
    // bigger files go through a resumable upload session instead.
    // (The Graph SDK's put() can't stream a Readable, so both paths go through
    // httpClient, which sets duplex: 'half' for stream bodies.)
    if (fileSize > SIMPLE_UPLOAD_LIMIT) {
      const session = await client.api(`${itemPath}:/createUploadSession`).post({
        item: {
          '@microsoft.graph.conflictBehavior': 'replace',
          name: fileName,
        },
      });

      return await uploadInSession({ uploadUrl: session.uploadUrl, body, fileSize });
    }

    const uploadResponse = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${baseUrl}/v1.0${itemPath}:/content`,
      body,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(fileSize),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return uploadResponse.body
  }
});

async function uploadInSession({
  uploadUrl,
  body,
  fileSize,
}: {
  uploadUrl: string;
  body: Readable;
  fileSize: number;
}) {
  let start = 0;
  let lastResponse: HttpResponse | undefined;

  for await (const chunk of streamUtils.readChunks({ readable: body, chunkSize: CHUNK_SIZE })) {
    lastResponse = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: uploadUrl,
      body: chunk,
      headers: {
        'Content-Length': String(chunk.length),
        'Content-Range': `bytes ${start}-${start + chunk.length - 1}/${fileSize}`,
      },
    });

    start += chunk.length;
  }

  return lastResponse?.body;
}
