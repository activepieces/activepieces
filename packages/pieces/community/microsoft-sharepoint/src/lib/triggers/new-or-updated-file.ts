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

const clientState = 'activepieces_sharepoint_new_or_updated_trigger';

export const newOrUpdatedFileTrigger = createTrigger({
  auth: microsoftSharePointAuth,
  name: 'new_or_updated_file',
  displayName: 'New or Updated File',
  description: 'Fires when a file is created or updated in a given folder.',
  props: {
    siteId: microsoftSharePointCommon.siteId,
    driveId: microsoftSharePointCommon.driveId,
    folderId: Property.Dropdown({
      displayName: 'Folder to Monitor',
      description: 'The folder to watch for new or updated files. Select "Root Folder" for the top-level folder of the drive.',
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
  },
  type: TriggerStrategy.WEBHOOK,

  sampleData: {
    "id": "01DRYVE_ID_GOES_HERE",
    "name": "Updated-Financials.xlsx",
    "webUrl": "https://contoso.sharepoint.com/Shared%20Documents/Updated-Financials.xlsx",
    "size": 65432,
    "createdDateTime": "2025-09-26T10:00:00Z",
    "lastModifiedDateTime": "2025-09-26T14:34:00Z",
    "file": {
      "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    },
    "parentReference": { "id": "PARENT_FOLDER_ID_HERE" }
  },

  async onEnable(context) {
    const { siteId, driveId, folderId } = context.propsValue;
    
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    const effectiveFolderId = folderId === 'root'
        ? (await client.api(`/drives/${driveId}/root`).get()).id
        : folderId;

    const expirationDateTime = new Date();
    expirationDateTime.setDate(expirationDateTime.getDate() + 2); 

    const subscription = await client.api('/subscriptions').post({
      changeType: 'created,updated', 
      notificationUrl: context.webhookUrl,
      resource: `/sites/${siteId}/drive/items/${effectiveFolderId}/children`,
      expirationDateTime: expirationDateTime.toISOString(),
      clientState: clientState,
    });

    await context.store.put('subscriptionId', subscription.id);
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
      
    const changedFilePayloads = [];
    for (const notification of validNotifications) {
        // The notification resource points to the created/updated item
        const changedFile = await client.api(notification.resource).get();
        // Ensure we only trigger for files, not folders
        if (changedFile.file) {
            changedFilePayloads.push(changedFile);
        }
    }
    return changedFilePayloads;
  },
});