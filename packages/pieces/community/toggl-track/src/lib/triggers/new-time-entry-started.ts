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

export const newTimeEntryStarted = createTrigger({
  auth: togglTrackAuth,
  name: 'new_time_entry_started',
  displayName: 'New Time Entry Started',
  description: 'Fires when a time entry is started and is currently running.',
  props: {
    workspace_id: togglCommon.workspace_id,
  },
  sampleData: {
    id: 1234567891,
    workspace_id: 987654,
    project_id: 123987456,
    task_id: null,
    billable: false,
    start: '2025-08-29T11:15:00Z',
    stop: null,
    duration: -1734567890,
    description: 'Working on API integration',
    tags: ['development', 'api'],
    at: '2025-08-29T11:15:00+00:00',
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

    // Create event filters for time entry updates (started entries have negative duration)
    // We listen for both created and updated events since starting can be either
    const eventFilters = [
      { entity: 'time_entry', action: 'created' },
      { entity: 'time_entry', action: 'updated' },
    ];

    // Generate unique description
    const description = generateSubscriptionDescription(
      'new-time-entry-started',
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

    // Filter for time entry events only
    if (!event.metadata.path?.includes('/time_entries')) {
      return [];
    }

    // Check if this is a started time entry (negative duration indicates running)
    if (event.payload && typeof event.payload === 'object') {
      const timeEntryData = event.payload as any;

      // A time entry is considered "started" if:
      // 1. It's a new entry being created (POST) with negative duration, OR
      // 2. It's an existing entry being updated (PUT) to have negative duration (restarted)
      if (
        timeEntryData.duration &&
        timeEntryData.duration < 0 &&
        (event.metadata.request_type === 'POST' ||
          event.metadata.request_type === 'PUT')
      ) {
        return [timeEntryData];
      }
    }

    return [];
  },
});
