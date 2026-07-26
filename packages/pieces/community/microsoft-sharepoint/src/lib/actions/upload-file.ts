import { buffer as readableToBuffer } from 'node:stream/consumers';
import { microsoftSharePointAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { microsoftSharePointCommon } from '../common';
import { Client } from '@microsoft/microsoft-graph-client';

export const uploadFile = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_upload_file',
  displayName: 'Upload File',
  description: 'Uploads a new file at path you specify.',
  audience: 'both',
  aiMetadata: {
    description: 'Uploads file content to a SharePoint document library (drive), placing it under a parent folder path with the file name you specify. Use to push a file (from a prior step or URL) into a site. Idempotent on the target path: uploading the same name to the same folder replaces the existing file rather than creating a duplicate.',
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

    // A known size lets us stream the body straight through with an explicit
    // Content-Length. Sources that don't report a size fall back to buffering.
    // (The Graph SDK's put() can't stream a Readable, so the upload goes through
    // httpClient, which sets duplex: 'half' for stream bodies.)
    const headers: Record<string, string> = { 'Content-Type': 'application/octet-stream' };
    let body;
    if (file.size != null) {
      headers['Content-Length'] = String(file.size);
      body = file.body;
    } else {
      body = await readableToBuffer(file.body);
    }

    const uploadResponse = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${baseUrl}/v1.0/sites/${siteId}/drives/${driveId}/items/${parentId}:/${fileName}:/content`,
      body,
      headers,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return uploadResponse.body
  }
});
