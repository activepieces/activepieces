import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { microsoft365CopilotAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';

export const copilotInteractionWebhook = createTrigger({
  auth: microsoft365CopilotAuth,
  name: 'copilotInteractionWebhook',
  displayName: 'When Copilot creates or updates an interaction',
  description:
    'Trigger when a new Copilot AI interaction is created, updated, or deleted',
  type: TriggerStrategy.WEBHOOK,
  props: {
    scope: Property.StaticDropdown({
      displayName: 'Notify me about interactions from',
      description:
        'Choose whether to monitor a specific user or the entire organization',
      required: true,
      options: {
        options: [
          {
            label: 'Specific User',
            value: 'user',
          },
          {
            label: 'Entire Organization',
            value: 'tenant',
          },
        ],
      },
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description:
        'The ID of the user to monitor (required for Specific User scope)',
      required: false,
    }),
    changeTypes: Property.StaticMultiSelectDropdown({
      displayName: 'What changes should trigger?',
      description: 'Select which types of changes to monitor',
      required: true,
      options: {
        options: [
          {
            label: 'New Interactions Created',
            value: 'created',
          },
          {
            label: 'Interactions Updated',
            value: 'updated',
          },
          {
            label: 'Interactions Deleted',
            value: 'deleted',
          },
        ],
      },
    }),
    expirationHours: Property.Number({
      displayName: 'Subscription Duration (hours)',
      description: 'How long should the subscription be active (1-24 hours)',
      required: false,
      defaultValue: 24,
    }),
  },
  sampleData: {
    subscriptionId: '10493aa0-4d29-4df5-bc0c-ef742cc6cd7f',
    changeType: 'created',
    clientState: 'activepieces-copilot-trigger',
    subscriptionExpirationDateTime: new Date().toISOString(),
    resource: "copilot/interactionHistory/interactions('1731701801008')",
    resourceData: {
      id: '1731701801008',
      '@odata.type': '#Microsoft.Graph.aiInteraction',
      '@odata.id': "copilot/interactionHistory/interactions('1731701801008')",
    },
    tenantId: 'tenant-id-example',
  },
  async onEnable(context) {
    const { scope, userId, changeTypes, expirationHours } =
      context.propsValue;

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    // Build the resource path
    let resourcePath = '';
    if (scope === 'user' && userId) {
      resourcePath = `/copilot/users/${userId}/interactionHistory/getAllEnterpriseInteractions`;
    } else {
      resourcePath = `/copilot/interactionHistory/getAllEnterpriseInteractions`;
    }

    // Add filters if specified
    const filters: string[] = [];

    filters.push("interactionType eq 'aiResponse'");

    if (filters.length > 0) {
      resourcePath += `?$filter=${filters.join(' AND ')}`;
    }

    const expirationDateTime = new Date();
    expirationDateTime.setHours(
      expirationDateTime.getHours() + (expirationHours || 24)
    );

    const subscriptionBody = {
      changeType: changeTypes.join(','),
      notificationUrl: context.webhookUrl,
      resource: resourcePath,
      includeResourceData: true,
      expirationDateTime: expirationDateTime.toISOString(),
      clientState: 'activepieces-copilot-trigger',
    };

    const subscription = await client
      .api('v1.0/subscriptions')
      .post(subscriptionBody);

    await context.store.put('subscription_id', subscription.id);
  },

  async onDisable(context) {
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    const subscriptionId = await context.store.get('subscription_id');
    if (subscriptionId) {
      try {
        await client.api(`v1.0/subscriptions/${subscriptionId}`).delete();
      } catch (error) {
        console.error('Error deleting subscription:', error);
      }
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
