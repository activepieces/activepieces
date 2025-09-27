import { microsoftSharePointAuth } from '../../';
import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { microsoftSharePointCommon } from '../common';
import { Client } from '@microsoft/microsoft-graph-client';

const clientState = 'activepieces_sharepoint_new_list_item_trigger';

export const newListItemTrigger = createTrigger({
  auth: microsoftSharePointAuth,
  name: 'new_list_item',
  displayName: 'New List Item',
  description: 'Fires when a new item is created in a SharePoint list.',
  props: {
    siteId: microsoftSharePointCommon.siteId,
    listId: microsoftSharePointCommon.listId,
  },
  type: TriggerStrategy.WEBHOOK,

  sampleData: {
    "id": "3",
    "createdDateTime": "2025-09-26T14:41:00Z",
    "lastModifiedDateTime": "2025-09-26T14:41:00Z",
    "webUrl": "https://contoso.sharepoint.com/sites/MySite/Lists/MyTasks/3_.000",
    "fields": {
        "@odata.etag": "\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx,1\"",
        "id": "3",
        "Title": "Draft Q4 Marketing Plan",
        "Status": "Not Started",
        "Priority": "Normal",
        "DueDate": "2025-11-15T00:00:00Z"
    }
  },

  async onEnable(context) {
    const { siteId, listId } = context.propsValue;
    
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    const expirationDateTime = new Date();
    expirationDateTime.setDate(expirationDateTime.getDate() + 2); 

    const subscription = await client.api('/subscriptions').post({
      changeType: 'created',
      notificationUrl: context.webhookUrl,
      resource: `/sites/${siteId}/lists/${listId}/items`,
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
      
    const newItemPayloads = [];
    for (const notification of validNotifications) {
        const newItem = await client.api(notification.resource).expand('fields').get();
        newItemPayloads.push(newItem);
    }
    return newItemPayloads;
  },
});