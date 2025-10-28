import { microsoftSharePointAuth } from '../../';
import {
  createAction,
  Property,
  DropdownOption,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { microsoftSharePointCommon } from '../common';
import { Client, PageCollection, ResponseType } from '@microsoft/microsoft-graph-client';
import { DriveItem } from '@microsoft/microsoft-graph-types';

const polling_delay_ms = 2000; 
const polling_timeout_secs = 120; 

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const copyItemWithinSiteAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_copy_item_within_site',
  displayName: 'Copy File or Folder (Within Site)',
  description: 'Copy a file or folder to another folder within the same site.',
  props: {
    siteId: microsoftSharePointCommon.siteId,
    driveId: microsoftSharePointCommon.driveId,
    itemId: microsoftSharePointCommon.itemId,
    destinationFolderId: Property.Dropdown({
      displayName: 'Destination Folder',
      description: 'The folder to copy the item into. Select "Root" to copy to the top level of the drive.',
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
            { label: 'Root', value: 'root' }
        ];
        let response: PageCollection = await client
          .api(
            `/sites/${siteId}/drives/${driveId}/root/children?$filter=folder ne null&$select=id,name`
          )
          .get();

        while (response.value.length > 0) {
          for (const item of response.value as DriveItem[]) {
            options.push({
              label: item.name!,
              value: item.id!,
            });
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
      description: 'A new name for the copied item. If not provided, the original name is used.',
      required: false,
    }),
    conflictBehavior: Property.StaticDropdown({
      displayName: 'Conflict Behavior',
      description: 'Action to take if a file with the same name already exists in the destination.',
      required: true,
      options: {
        options: [
          { label: 'Fail on conflict', value: 'fail' },
          { label: 'Overwrite existing file', value: 'replace' },
          { label: 'Rename with a number', value: 'rename' },
        ],
      },
      defaultValue: 'fail',
    }),
  },
  async run(context) {
    const { siteId, driveId, itemId, destinationFolderId, newName, conflictBehavior } =
      context.propsValue;

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    const effectiveDestinationId = destinationFolderId === 'root'
      ? (await client.api(`/drives/${driveId}/root`).get()).id
      : destinationFolderId;

    const body: {
        parentReference: { id?: string };
        name?: string;
    } = {
        parentReference: {
            id: effectiveDestinationId,
        },
    };

    if (newName) {
      body.name = newName;
    }

    let initialResponse;
    try {
      initialResponse = await client
        .api(`/drives/${driveId}/items/${itemId}/copy`)
        .responseType(ResponseType.RAW)
        .query({ '@microsoft.graph.conflictBehavior': conflictBehavior })
        .post(body);
    } catch (error: any) {
      if (error.statusCode === 400) {
        throw new Error(`Invalid request: ${error.message || 'Check your input parameters'}`);
      }
      if (error.statusCode === 403) {
        throw new Error('Insufficient permissions to copy this item. Requires Files.ReadWrite or higher.');
      }
      if (error.statusCode === 404) {
        throw new Error('Source item not found. Please verify the site, drive, and item IDs.');
      }
      throw new Error(`Failed to initiate copy operation: ${error.message || 'Unknown error'}`);
    }

    const monitorUrl = initialResponse.headers.get('Location');
    if (!monitorUrl) {
      throw new Error('Could not get monitor URL from copy operation response.');
    }

    let attempts = polling_timeout_secs * 1000 / polling_delay_ms;
    while (attempts > 0) {
      const monitorResponse = await client.api(monitorUrl).get();
      if (monitorResponse.status === 'completed') {
        return {
          success: true,
          status: 'completed',
          resourceId: monitorResponse.resourceId,
          resourceLocation: monitorResponse.resourceLocation,
        };
      }
      if (monitorResponse.status === 'failed') {
        const errorDetails = monitorResponse.error?.details
          ? monitorResponse.error.details.map((d: any) => d.message || d.code).join(', ')
          : monitorResponse.error?.message || 'Unknown error';
        throw new Error(`Copy operation failed: ${errorDetails}`);
      }
      await delay(polling_delay_ms);
      attempts--;
    }

    throw new Error('Copy operation timed out after 120 seconds.');
  },
});