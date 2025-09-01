import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';
import {
  TogglWebhookManager,
  TogglWebhookEvent,
  generateWebhookSecret,
  createEventFilters,
  generateSubscriptionDescription,
} from '../common/webhook-utils';

export const newProject = createTrigger({
  auth: togglTrackAuth,
  name: 'new_project',
  displayName: 'New Project',
  description: 'Fires when a new project is added.',
  props: {
    workspace_id: togglCommon.workspace_id,
  },
  sampleData: {
    id: 123456789,
    workspace_id: 987654,
    client_id: 456789,
    name: 'New Website Development',
    is_private: false,
    active: true,
    at: '2025-08-29T10:15:30+00:00',
    color: '#3750b5',
    billable: true,
    template: false,
    auto_estimates: false,
    estimated_hours: 40,
    rate: 75.0,
    rate_last_updated: null,
    currency: 'USD',
    recurring: false,
    recurring_parameters: null,
    current_period: null,
    fixed_fee: null,
    actual_hours: 0,
    actual_seconds: 0,
  },
  type: TriggerStrategy.WEBHOOK,
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.BODY_PARAM_PRESENT,
    paramName: 'validation_code',
  },

  async onHandshake(context) {
    const body = context.payload.body as {
      payload?: string;
      validation_code?: string;
    };

    // Handle Toggl PING events with validation_code
    if (body?.payload === 'ping' && body?.validation_code) {
      return {
        status: 200,
        body: { validation_code: body.validation_code },
        headers: {
          'Content-Type': 'application/json',
        },
      };
    }

    return {
      status: 400,
      body: { error: 'Invalid handshake request' },
    };
  },

  async onEnable(context) {
    const webhookManager = new TogglWebhookManager(context.auth);
    const workspaceId = context.propsValue.workspace_id;

    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    // Generate a secret for webhook validation
    const secret = generateWebhookSecret();

    // Create event filters for project creation
    const eventFilters = createEventFilters('project', 'created');

    // Generate unique description
    const description = generateSubscriptionDescription(
      'new-project',
      workspaceId
    );

    try {
      // Create webhook subscription with enabled: true and rely on handshake
      const subscription = await webhookManager.createSubscription(
        workspaceId,
        context.webhookUrl,
        eventFilters,
        description,
        secret,
        true // enabled, handshake will handle validation
      );

      // Store subscription details
      await context.store.put('webhook_subscription', {
        subscriptionId: subscription.subscription_id,
        workspaceId: workspaceId,
        secret: secret,
      });

      // Validate the subscription asynchronously
      setTimeout(async () => {
        try {
          await webhookManager.validateSubscription(
            workspaceId,
            subscription.subscription_id
          );
        } catch (error) {
          console.error('Failed to validate webhook subscription:', error);
        }
      }, 5000);
    } catch (error) {
      throw new Error(`Failed to create webhook subscription: ${error}`);
    }
  },

  async onDisable(context) {
    const storedData = await context.store.get<{
      subscriptionId: number;
      workspaceId: number;
      secret: string;
    }>('webhook_subscription');

    if (storedData) {
      try {
        const webhookManager = new TogglWebhookManager(context.auth);
        await webhookManager.deleteSubscription(
          storedData.workspaceId,
          storedData.subscriptionId
        );
      } catch (error) {
        console.error('Failed to delete webhook subscription:', error);
      }

      await context.store.delete('webhook_subscription');
    }
  },

  async run(context) {
    const { body, headers } = context.payload;

    // Get stored subscription data for validation
    const storedData = await context.store.get<{
      subscriptionId: number;
      workspaceId: number;
      secret: string;
    }>('webhook_subscription');

    if (!storedData) {
      throw new Error('Webhook subscription data not found');
    }

    // Validate webhook signature
    const signature = headers['x-webhook-signature-256'];
    if (!signature) {
      throw new Error('Missing webhook signature');
    }

    const webhookManager = new TogglWebhookManager(context.auth);
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);

    if (
      !webhookManager.validateEventSignature(
        bodyString,
        signature,
        storedData.secret
      )
    ) {
      throw new Error('Invalid webhook signature');
    }

    // Parse webhook event
    const event: TogglWebhookEvent =
      webhookManager.parseWebhookEvent(bodyString);

    // Skip PING events (handled by onHandshake)
    if (event.payload === 'ping') {
      return [];
    }

    // Validate that this event is for our subscription
    if (event.subscription_id !== storedData.subscriptionId) {
      throw new Error('Event subscription ID mismatch');
    }

    // Validate URL callback matches
    if (event.url_callback !== context.webhookUrl) {
      throw new Error('URL callback mismatch');
    }

    // Filter for project creation events only
    if (
      event.metadata.request_type !== 'POST' ||
      !event.metadata.path?.includes('/projects')
    ) {
      return [];
    }

    // Return the project data from the payload
    if (event.payload && typeof event.payload === 'object') {
      return [event.payload];
    }

    return [];
  },
});
