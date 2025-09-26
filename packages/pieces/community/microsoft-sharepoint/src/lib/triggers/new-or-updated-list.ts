import { microsoftSharePointAuth } from '../../';
import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { microsoftSharePointCommon } from '../common';
import { Client } from '@microsoft/microsoft-graph-client';

const clientState = 'activepieces_sharepoint_new_or_updated_list_trigger';

export const newOrUpdatedListTrigger = createTrigger({
  auth: microsoftSharePointAuth,
  name: 'new_or_updated_list',
  displayName: 'New or Updated List',
  description: 'Fires when a list is created or updated in a site.',
  props: {
    siteId: microsoftSharePointCommon.siteId,
  },
  type: TriggerStrategy.WEBHOOK,

  sampleData: {
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "displayName": "Projects Tracker",
    "description": "Updated list for tracking all ongoing projects.",
    "createdDateTime": "2025-09-26T11:00:00Z",
    "lastModifiedDateTime": "2025-09-26T14:55:00Z",
    "webUrl": "https://contoso.sharepoint.com/sites/MySite/Lists/Projects%20Tracker"
  },

  async onEnable(context) {
    const { siteId } = context.propsValue;
    
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    const expirationDateTime = new Date();
    expirationDateTime.setDate(expirationDateTime.getDate() + 2); 

    const subscription = await client.api('/subscriptions').post({
      changeType: 'created,updated',
      notificationUrl: context.webhookUrl,
      resource: `/sites/${siteId}/lists`,
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
      
    const listPayloads = [];
    for (const notification of validNotifications) {
        const changedList = await client.api(notification.resource).get();
        listPayloads.push(changedList);
    }
    return listPayloads;
  },
});