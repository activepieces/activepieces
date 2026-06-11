import { microsoftSharePointAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
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
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
      baseUrl: getGraphBaseUrl(cloud),
    });

    const parentIdResponse = await client.api(`/sites/${siteId}/drives/${driveId}/root:${parentFolder}`).get()
    const parentId = parentIdResponse.id ?? "test";

    const uploadResponse = await client.api(`/sites/${siteId}/drives/${driveId}/items/${parentId}:/${fileName}:/content`).put(file.data)

    return uploadResponse
  }
});
