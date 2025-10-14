import { microsoftSharePointAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftSharePointCommon } from '../common';
import { Client, ResponseType } from '@microsoft/microsoft-graph-client';

const polling_delay_ms = 2000; 
const polling_timeout_secs = 120; 

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const copyItemAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_copy_item',
  displayName: 'Copy File or Folder (Across Sites)',
  description:
    'Copy a file or folder from one site to another within the same tenant, with overwrite option.',
  props: {

    siteId: microsoftSharePointCommon.siteId,
    driveId: microsoftSharePointCommon.driveId,
    itemId: microsoftSharePointCommon.itemId,

    destination_site_id: microsoftSharePointCommon.siteId,
    destination_drive_id: microsoftSharePointCommon.createDriveDropdown({
      displayName: 'Destination Drive',
      refreshers: ['destination_site_id'],
    }),
    destination_folder_id: microsoftSharePointCommon.destinationFolderId,

    new_name: Property.ShortText({
      displayName: 'New Name (Optional)',
      description: 'A new name for the copied item. If not provided, the original name is used.',
      required: false,
    }),
    conflict_behavior: Property.StaticDropdown({
      displayName: 'Conflict Behavior',
      description: 'Action to take if a file with the same name already exists.',
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
    const {
      siteId,
      driveId,
      itemId,
      destination_drive_id,
      destination_folder_id,
      new_name,
      conflict_behavior,
    } = context.propsValue;

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    const body: { parentReference: { driveId: string; id?: string }; name?: string } = {
      parentReference: {
        driveId: destination_drive_id,
      },
    };

    if (destination_folder_id) {
      body.parentReference.id = destination_folder_id;
    }
    if (new_name) {
      body.name = new_name;
    }

    let initialResponse;
    try {
      initialResponse = await client
        .api(`/drives/${driveId}/items/${itemId}/copy`)
        .responseType(ResponseType.RAW)
        .query({ '@microsoft.graph.conflictBehavior': conflict_behavior })
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