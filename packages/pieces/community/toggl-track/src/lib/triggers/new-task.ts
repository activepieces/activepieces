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

export const newTask = createTrigger({
  auth: togglTrackAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Fires when a new task is created.',
  props: {
    workspace_id: togglCommon.workspace_id,
    optional_project_id: togglCommon.optional_project_id,
  },
  sampleData: {
    id: 789123456,
    name: 'Design homepage mockup',
    project_id: 123456789,
    workspace_id: 987654,
    user_id: 6,
    estimated_seconds: 7200,
    active: true,
    at: '2025-08-29T10:15:30+00:00',
    tracked_seconds: 0,
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

    // Create event filters for task creation
    const eventFilters = createEventFilters('task', 'created');

    // Generate unique description
    const description = generateSubscriptionDescription(
      'new-task',
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
        projectFilter: context.propsValue.optional_project_id,
      });

      // No need for additional validation - handshake handles it
    } catch (error) {
      throw new Error(`Failed to create webhook subscription: ${error}`);
    }
  },

  async onDisable(context) {
    const storedData = await context.store.get<{
      subscriptionId: number;
      workspaceId: number;
      secret: string;
      projectFilter?: number;
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
      projectFilter?: number;
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

    // Filter for task creation events only
    if (
      event.metadata.request_type !== 'POST' ||
      !event.metadata.path?.includes('/tasks')
    ) {
      return [];
    }

    // Check if we have a project filter and apply it
    if (
      storedData.projectFilter &&
      event.payload &&
      typeof event.payload === 'object'
    ) {
      const taskData = event.payload as any;
      if (taskData.project_id !== storedData.projectFilter) {
        return [];
      }
    }

    // Return the task data from the payload
    if (event.payload && typeof event.payload === 'object') {
      return [event.payload];
    }

    return [];
  },
});
