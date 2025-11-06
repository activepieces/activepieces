import { microsoftSharePointAuth } from '../../';
import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { microsoftSharePointCommon } from '../common';
import { Client } from '@microsoft/microsoft-graph-client';

const clientState = 'activepieces_sharepoint_updated_list_item_trigger';

export const updatedListItemTrigger = createTrigger({
  auth: microsoftSharePointAuth,
  name: 'updated_list_item',
  displayName: 'Updated List Item',
  description: 'Fires when an existing item in a SharePoint list is updated.',
  props: {
    siteId: microsoftSharePointCommon.siteId,
    listId: microsoftSharePointCommon.listId,
  },
  type: TriggerStrategy.WEBHOOK,

  sampleData: {
    "id": "2",
    "createdDateTime": "2025-09-26T14:10:00Z",
    "lastModifiedDateTime": "2025-09-26T14:38:00Z",
    "webUrl": "https://contoso.sharepoint.com/sites/MySite/Lists/MyTasks/2_.000",
    "fields": {
        "@odata.etag": "\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx,2\"",
        "id": "2",
        "Title": "Complete Project Proposal",
        "Status": "In Progress",
        "Priority": "High",
        "DueDate": "2025-10-05T00:00:00Z"
    }
  },

  async onEnable(context) {
    const { siteId, listId } = context.propsValue;
    
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    try {
      const expirationDateTime = new Date();
      expirationDateTime.setDate(expirationDateTime.getDate() + 2); 

      const subscription = await client.api('/subscriptions').post({
        changeType: 'updated',
        notificationUrl: context.webhookUrl,
        resource: `/sites/${siteId}/lists/${listId}/items`,
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
      
    const updatedItemPayloads = [];
    for (const notification of validNotifications) {
        try {
          const updatedItem = await client.api(notification.resource).expand('fields').get();
          updatedItemPayloads.push(updatedItem);
        } catch (error) {
          console.error('Error fetching list item from notification:', error);
        }
    }
    return updatedItemPayloads;
  },
});