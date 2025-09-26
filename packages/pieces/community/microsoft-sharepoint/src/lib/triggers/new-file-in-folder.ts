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

const clientState = 'activepieces_sharepoint_trigger';

export const newFileInFolderTrigger = createTrigger({
  auth: microsoftSharePointAuth,
  name: 'new_file_in_folder',
  displayName: 'New File in Folder',
  description: 'Fires when a new file is created or added in a specific folder.',
  props: {
    siteId: microsoftSharePointCommon.siteId,
    driveId: microsoftSharePointCommon.driveId,
    folderId: Property.Dropdown({
      displayName: 'Folder to Monitor',
      description: 'The folder to watch for new files. Select "Root Folder" for the top-level folder of the drive.',
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
    "name": "Example-Report.docx",
    "webUrl": "https://contoso.sharepoint.com/Shared%20Documents/Example-Report.docx",
    "size": 12345,
    "createdDateTime": "2025-09-26T14:26:12Z",
    "lastModifiedDateTime": "2025-09-26T14:26:12Z",
    "file": {
      "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    },
    "parentReference": {
      "driveId": "DRIVE_ID_HERE",
      "id": "PARENT_FOLDER_ID_HERE",
      "path": "/drives/DRIVE_ID_HERE/root:/Shared Documents"
    }
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
      changeType: 'created',
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
      
    const newFilePayloads = [];
    for (const notification of validNotifications) {
        const newFile = await client.api(notification.resource).get();
        if (newFile.file) { 
            newFilePayloads.push(newFile);
        }
    }
    return newFilePayloads;
  },
});