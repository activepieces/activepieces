import { microsoftSharePointAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftSharePointCommon } from '../common';
import { Client } from '@microsoft/microsoft-graph-client';

export const createFolderAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_create_folder',
  displayName: 'Create Folder',
  description: 'Creates a new folder at path you specify.',
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

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    const folderPath = parentFolder + folderName;

    // https://stackoverflow.com/questions/66631136/creating-nested-folder-in-sharepoint-with-graph-api-fails
    return await client.api(`/drives/${driveId}/root:${folderPath}`).patch({
      folder: {},
    });
  },
});
