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

const clientState = 'activepieces_sharepoint_subfolder_trigger';

export const newFileInSubfoldersTrigger = createTrigger({
  auth: microsoftSharePointAuth,
  name: 'new_file_in_subfolders',
  displayName: 'New File in Subfolders',
  description: 'Fires when a new file is added anywhere in the first-level subfolders of a folder. Note: This trigger will not monitor subfolders created after the flow is activated.',
  props: {
    siteId: microsoftSharePointCommon.siteId,
    driveId: microsoftSharePointCommon.driveId,
    parentFolderId: Property.Dropdown({
      displayName: 'Parent Folder',
      description: 'The parent folder whose subfolders you want to monitor.',
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
    "id": "01DRYVE_ID_GOES_HERE",
    "name": "New-File-In-Subfolder.pdf",
    "webUrl": "https://contoso.sharepoint.com/Shared%20Documents/SubfolderA/New-File-In-Subfolder.pdf",
    "size": 54321,
    "createdDateTime": "2025-09-26T14:30:00Z",
    "lastModifiedDateTime": "2025-09-26T14:30:00Z",
    "file": { "mimeType": "application/pdf" },
    "parentReference": { "id": "SUBFOLDER_ID_HERE" }
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

      const subfoldersResponse = await client.api(`/drives/${driveId}/items/${effectiveParentId}/children?$filter=folder ne null&$select=id`).get();
      const subfolders = subfoldersResponse.value as DriveItem[];

      const expirationDateTime = new Date();
      expirationDateTime.setDate(expirationDateTime.getDate() + 2);

      const subscriptionPromises = subfolders.map(folder => 
          client.api('/subscriptions').post({
              changeType: 'created',
              notificationUrl: context.webhookUrl,
              resource: `/sites/${siteId}/drive/items/${folder.id}/children`,
              expirationDateTime: expirationDateTime.toISOString(),
              clientState: clientState,
          })
      );
      
      const settledSubscriptions = await Promise.allSettled(subscriptionPromises);
      const subscriptionIds = settledSubscriptions
          .filter(res => res.status === 'fulfilled')
          .map(res => (res as PromiseFulfilledResult<any>).value.id);

      await context.store.put('subscriptionIds', subscriptionIds);
    } catch (error: any) {
      throw new Error(`Failed to create subscriptions: ${error.message || 'Unknown error'}`);
    }
  },

  async onDisable(context) {
    const subscriptionIds = await context.store.get<string[]>('subscriptionIds');
    if (subscriptionIds && subscriptionIds.length > 0) {
        const client = Client.initWithMiddleware({
            authProvider: {
              getAccessToken: () => Promise.resolve(context.auth.access_token),
            },
        });
        const deletionPromises = subscriptionIds.map(id =>
            client.api(`/subscriptions/${id}`).delete().catch(err => console.error(`Failed to delete subscription ${id}:`, err))
        );
        await Promise.allSettled(deletionPromises);
    }
    await context.store.delete('subscriptionIds');
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
      
    const newFilePayloads = [];
    for (const notification of validNotifications) {
        try {
          const newFile = await client.api(notification.resource).get();
          if (newFile.file) { 
              newFilePayloads.push(newFile);
          }
        } catch (error) {
          console.error('Error fetching file from notification:', error);
        }
    }
    return newFilePayloads;
  },
});