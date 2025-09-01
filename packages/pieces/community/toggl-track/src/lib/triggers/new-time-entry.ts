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

export const newTimeEntry = createTrigger({
  auth: togglTrackAuth,
  name: 'new_time_entry',
  displayName: 'New Time Entry',
  description:
    'Fires when a new time entry is added (with optional project/task filter).',
  props: {
    workspace_id: togglCommon.workspace_id,
    optional_project_id: togglCommon.optional_project_id,
    task_id: togglCommon.optional_task_id,
  },
  sampleData: {
    id: 1234567890,
    workspace_id: 987654,
    project_id: 123987456,
    task_id: 789123456,
    billable: false,
    start: '2025-08-29T11:00:00Z',
    stop: '2025-08-29T11:30:00Z',
    duration: 1800,
    description: 'Weekly team meeting',
    tags: ['meeting', 'internal'],
    at: '2025-08-29T11:30:00+00:00',
    user_id: 6,
    created_with: 'Toggl Track',
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

    // Create event filters for time entry creation
    const eventFilters = createEventFilters('time_entry', 'created');

    // Generate unique description
    const description = generateSubscriptionDescription(
      'new-time-entry',
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
        taskFilter: context.propsValue.task_id,
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
      taskFilter?: number;
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
      taskFilter?: number;
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

    // Filter for time entry creation events only
    if (
      event.metadata.request_type !== 'POST' ||
      !event.metadata.path?.includes('/time_entries')
    ) {
      return [];
    }

    // Apply filters if specified
    if (event.payload && typeof event.payload === 'object') {
      const timeEntryData = event.payload as any;

      // Check project filter
      if (
        storedData.projectFilter &&
        timeEntryData.project_id !== storedData.projectFilter
      ) {
        return [];
      }

      // Check task filter
      if (
        storedData.taskFilter &&
        timeEntryData.task_id !== storedData.taskFilter
      ) {
        return [];
      }

      return [timeEntryData];
    }

    return [];
  },
});
