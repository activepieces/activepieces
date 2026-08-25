import { microsoftSharePointAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { microsoftSharePointCommon } from '../common';
import { Client } from '@microsoft/microsoft-graph-client';

export const createFolderAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_create_folder',
  displayName: 'Create Folder',
  description: 'Creates a new folder at path you specify.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a folder at a given path inside a SharePoint document library (drive), creating it relative to a parent folder path or the drive root. Use to provision a destination folder before uploading or moving files. Requires the target site and drive; the folder is keyed on its path, so re-running with the same path leaves the existing folder in place rather than producing a duplicate.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointCommon.siteId,
    driveId: microsoftSharePointCommon.driveId,
    parentFolder: Property.ShortText({
      displayName: 'Parent Folder',
      description: `Parent folder,like "/demo/" or "/docs/assignment/".Leave it default if you want to create folder at the root (**/**) level.`,
      required: true,
      defaultValue: '/',
    }),
    folderName: Property.ShortText({
      displayName: 'Folder Name',
      required: true,
    }),
  },
  async run(context) {
    const { driveId, parentFolder, folderName } = context.propsValue;

    const cloud = context.auth.props?.['cloud'] as string | undefined;
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
      baseUrl: getGraphBaseUrl(cloud),
    });

    const folderPath = parentFolder + folderName;

    // https://stackoverflow.com/questions/66631136/creating-nested-folder-in-sharepoint-with-graph-api-fails
    return await client.api(`/drives/${driveId}/root:${folderPath}`).patch({
      folder: {},
    });
  },
});
