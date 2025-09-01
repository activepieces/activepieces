import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
import { togglTrackAuth } from '../..';
import {
  TogglWebhookManager,
  TogglWebhookEvent,
  generateWebhookSecret,
  createEventFilters,
  generateSubscriptionDescription,
} from '../common/webhook-utils';

export const newWorkspace = createTrigger({
  auth: togglTrackAuth,
  name: 'new_workspace',
  displayName: 'New Workspace',
  description: 'Fires when a new workspace is created.',
  props: {},
  sampleData: {
    id: 123456,
    organization_id: 98765,
    name: 'My New Workspace',
    premium: true,
    admin: true,
    default_currency: 'USD',
    only_admins_may_create_projects: false,
    only_admins_see_billable_rates: true,
    rounding: 1,
    rounding_minutes: 0,
    at: '2025-08-29T10:15:30+00:00',
    logo_url: 'https://assets.toggl.com/images/workspace.jpg',
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

    // For workspace events, we'll use a default workspace ID from the user's profile
    // since workspace creation events need to be subscribed to at a higher level
    const userResponse = await fetch('https://api.track.toggl.com/api/v9/me', {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${context.auth}:api_token`
        ).toString('base64')}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user information');
    }

    const userData = await userResponse.json();
    const defaultWorkspaceId = userData.default_workspace_id;

    if (!defaultWorkspaceId) {
      throw new Error('No default workspace found');
    }

    // Generate a secret for webhook validation
    const secret = generateWebhookSecret();

    // Create event filters for workspace creation
    const eventFilters = createEventFilters('workspace', 'created');

    // Generate unique description
    const description = generateSubscriptionDescription(
      'new-workspace',
      defaultWorkspaceId
    );

    try {
      // Create webhook subscription with enabled: true and rely on handshake
      const subscription = await webhookManager.createSubscription(
        defaultWorkspaceId,
        context.webhookUrl,
        eventFilters,
        description,
        secret,
        true // enabled, handshake will handle validation
      );

      // Store subscription details
      await context.store.put('webhook_subscription', {
        subscriptionId: subscription.subscription_id,
        workspaceId: defaultWorkspaceId,
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

    // Filter for workspace creation events only
    if (
      event.metadata.request_type !== 'POST' ||
      !event.metadata.path?.includes('/workspaces')
    ) {
      return [];
    }

    // Return the workspace data from the payload
    if (event.payload && typeof event.payload === 'object') {
      return [event.payload];
    }

    return [];
  },
});
