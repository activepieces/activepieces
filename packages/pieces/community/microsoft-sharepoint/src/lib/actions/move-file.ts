import { microsoftSharePointAuth } from '../../';
import {
  createAction,
  Property,
  DropdownOption,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { microsoftSharePointCommon } from '../common';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { DriveItem } from '@microsoft/microsoft-graph-types';

export const moveFileAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_move_file',
  displayName: 'Move File',
  description: 'Move a file from one folder to another within the same drive.',
  props: {
    siteId: microsoftSharePointCommon.siteId,
    driveId: microsoftSharePointCommon.driveId,
    fileId: Property.Dropdown({
      displayName: 'File to Move',
      description: 'The file you want to move.',
      required: true,
      refreshers: ['siteId', 'driveId'],
      options: async ({ auth, siteId, driveId }) => {
        if (!auth || !siteId || !driveId) {
          return {
            disabled: true,
            placeholder: 'Select a site and drive first.',
            options: [],
          };
        }
        const authValue = auth as PiecePropValueSchema<
          typeof microsoftSharePointAuth
        >;
        const client = Client.initWithMiddleware({
          authProvider: {
            getAccessToken: () => Promise.resolve(authValue.access_token),
          },
        });
        const options: DropdownOption<string>[] = [];
        let response: PageCollection = await client
          .api(
            `/sites/${siteId}/drives/${driveId}/root/children?$filter=file ne null&$select=id,name`
          )
          .get();
        while (response.value.length > 0) {
          for (const item of response.value as DriveItem[]) {
            options.push({ label: item.name!, value: item.id! });
          }
          if (response['@odata.nextLink']) {
            response = await client.api(response['@odata.nextLink']).get();
          } else {
            break;
          }
        }
        return { disabled: false, options };
      },
    }),
    destinationFolderId: Property.Dropdown({
      displayName: 'Destination Folder',
      description: 'The folder to move the file into. Select "Root" to move to the top level of the drive.',
      required: true,
      refreshers: ['siteId', 'driveId'],
      options: async ({ auth, siteId, driveId }) => {
        if (!auth || !siteId || !driveId) {
          return {
            disabled: true,
            placeholder: 'Select a site and drive first.',
            options: [],
          };
        }
        const authValue = auth as PiecePropValueSchema<
          typeof microsoftSharePointAuth
        >;
        const client = Client.initWithMiddleware({
          authProvider: {
            getAccessToken: () => Promise.resolve(authValue.access_token),
          },
        });
        const options: DropdownOption<string>[] = [
          { label: 'Root', value: 'root' },
        ];
        let response: PageCollection = await client
          .api(
            `/sites/${siteId}/drives/${driveId}/root/children?$filter=folder ne null&$select=id,name`
          )
          .get();
        while (response.value.length > 0) {
          for (const item of response.value as DriveItem[]) {
            options.push({ label: item.name!, value: item.id! });
          }
          if (response['@odata.nextLink']) {
            response = await client.api(response['@odata.nextLink']).get();
          } else {
            break;
          }
        }
        return { disabled: false, options };
      },
    }),
    newName: Property.ShortText({
      displayName: 'New Name (Optional)',
      description: 'Provide a new name to rename the file during the move.',
      required: false,
    }),
  },
  async run(context) {
    const { siteId, driveId, fileId, destinationFolderId, newName } =
      context.propsValue;

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });


    const effectiveDestinationId =
      destinationFolderId === 'root'
        ? (await client.api(`/drives/${driveId}/root`).get()).id
        : destinationFolderId;

    const requestBody: {
      parentReference: { id: string };
      name?: string;
    } = {
      parentReference: {
        id: effectiveDestinationId,
      },
    };

    if (newName) {
      requestBody.name = newName;
    }


    return await client
      .api(`/sites/${siteId}/drive/items/${fileId}`)
      .patch(requestBody);
  },
});