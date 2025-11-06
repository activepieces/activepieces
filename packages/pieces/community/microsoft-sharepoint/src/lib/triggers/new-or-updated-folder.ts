import { microsoftSharePointAuth } from '../../';
import {
  createTrigger,
  TriggerStrategy,
  Property,
  DropdownOption,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { microsoftSharePointCommon } from '../common';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { DriveItem } from '@microsoft/microsoft-graph-types';

const clientState = 'activepieces_sharepoint_new_or_updated_folder_trigger';

export const newOrUpdatedFolderTrigger = createTrigger({
  auth: microsoftSharePointAuth,
  name: 'new_or_updated_folder',
  displayName: 'New or Updated Folder',
  description: 'Fires when a folder is created or updated (e.g., name change).',
  props: {
    siteId: microsoftSharePointCommon.siteId,
    driveId: microsoftSharePointCommon.driveId,
    parentFolderId: Property.Dropdown({
      displayName: 'Parent Folder to Monitor',
      description: 'The folder to watch for new or updated subfolders. Select "Root Folder" to monitor the top-level of the drive.',
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
          { label: 'Root Folder', value: 'root' },
        ];
        let response: PageCollection = await client
          .api(
            `/drives/${driveId}/root/children?$filter=folder ne null&$select=id,name`
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
  },
  type: TriggerStrategy.WEBHOOK,

  sampleData: {
    "id": "01DRYVE_FOLDER_ID_GOES_HERE",
    "name": "Project Alpha",
    "webUrl": "https://contoso.sharepoint.com/Shared%20Documents/Project%20Alpha",
    "size": 0,
    "createdDateTime": "2025-09-26T14:50:00Z",
    "lastModifiedDateTime": "2025-09-26T14:50:00Z",
    "folder": {
      "childCount": 0
    },
    "parentReference": { "id": "PARENT_FOLDER_ID_HERE" }
  },

  async onEnable(context) {
    const { siteId, driveId, parentFolderId } = context.propsValue;
    
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    try {
      const effectiveParentId = parentFolderId === 'root'
          ? (await client.api(`/drives/${driveId}/root`).get()).id
          : parentFolderId;

      const expirationDateTime = new Date();
      expirationDateTime.setDate(expirationDateTime.getDate() + 2); 

      const subscription = await client.api('/subscriptions').post({
        changeType: 'created,updated',
        notificationUrl: context.webhookUrl,
        resource: `/sites/${siteId}/drive/items/${effectiveParentId}/children`,
        expirationDateTime: expirationDateTime.toISOString(),
        clientState: clientState,
      });

      await context.store.put('subscriptionId', subscription.id);
    } catch (error: any) {
      throw new Error(`Failed to create subscription: ${error.message || 'Unknown error'}`);
    }
  },

  async onDisable(context) {
    const subscriptionId = await context.store.get<string>('subscriptionId');
    if (subscriptionId) {
      const client = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: () => Promise.resolve(context.auth.access_token),
        },
      });
      try {
        await client.api(`/subscriptions/${subscriptionId}`).delete();
      } catch (error) {
        console.warn(`Error deleting subscription ${subscriptionId}:`, error);
      }
    }
    await context.store.delete('subscriptionId');
  },

  async run(context) {
    const notifications = (context.payload.body as { value: any[] })?.value;
    if (!notifications || !Array.isArray(notifications)) {
      return [];
    }

    const validNotifications = notifications.filter(
      (notif) => notif.clientState === clientState
    );
    if (validNotifications.length === 0) {
      return [];
    }

    const client = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: () => Promise.resolve(context.auth.access_token),
        },
    });
      
    const folderPayloads = [];
    for (const notification of validNotifications) {
        try {
          const changedItem = await client.api(notification.resource).get();
          if (changedItem.folder) { 
              folderPayloads.push(changedItem);
          }
        } catch (error) {
          console.error('Error fetching folder from notification:', error);
        }
    }
    return folderPayloads;
  },
});