import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { oktaAuth, makeOktaRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';
import { WebhookHandshakeStrategy, tryCatch } from '@activepieces/pieces-framework';

export const newEventTrigger = createTrigger({
  auth: oktaAuth,
  name: 'new_event',
  displayName: 'New Event',
  description: 'Fires when a new Okta event is generated',
  aiMetadata: {
    description: 'Fires via an Okta Event Hook when a system event occurs in the org, emitting one item per matching event. By default it covers user lifecycle changes (create/activate/deactivate/suspend/unsuspend/delete), group membership add/remove, group lifecycle, and session start/end; if specific Event Types are selected, only those fire. Use to react in real time to identity and access changes in Okta.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    eventTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Event Types to Monitor',
      description: 'Select which event types to trigger on',
      required: false,
      options: {
        options: [
          { label: 'User Created', value: 'user.lifecycle.create' },
          { label: 'User Activated', value: 'user.lifecycle.activate' },
          { label: 'User Deactivated', value: 'user.lifecycle.deactivate' },
          { label: 'User Suspended', value: 'user.lifecycle.suspend' },
          { label: 'User Unsuspended', value: 'user.lifecycle.unsuspend' },
          { label: 'User Deleted', value: 'user.lifecycle.delete.completed' },
          { label: 'User Added to Group', value: 'group.user_membership.add' },
          {
            label: 'User Removed from Group',
            value: 'group.user_membership.remove',
          },
          { label: 'Group Created', value: 'group.lifecycle.create' },
          { label: 'Group Deleted', value: 'group.lifecycle.delete' },
          { label: 'User Login', value: 'user.session.start' },
          { label: 'User Logout', value: 'user.session.end' },
        ],
      },
    }),
    hookName: Property.ShortText({
      displayName: 'Hook Name',
      description: 'Name for the Okta Event Hook (optional)',
      required: false,
      defaultValue: 'Activepieces Webhook',
    }),
  },
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.HEADER_PRESENT,
    paramName: 'x-okta-verification-challenge',
  },
  async onHandshake(context) {
    const challengeValue =
      context.payload.headers['x-okta-verification-challenge'];

    if (challengeValue) {
      console.log('Okta verification challenge received:', challengeValue);
      return {
        status: 200,
        body: {
          verification: challengeValue,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      };
    }

    return {
      status: 400,
      body: { error: 'No verification challenge found' },
    };
  },
  async onEnable(context) {
    try {
      const eventTypes = context.propsValue.eventTypes || [];
      const hookName = context.propsValue.hookName || 'Webhook';

      const existingHooks = await makeOktaRequest(
        context.auth,
        '/eventHooks',
        HttpMethod.GET
      );

      const existingHook = existingHooks.body?.find(
        (hook: any) =>
          hook.name === hookName &&
          hook.channel?.config?.uri === context.webhookUrl
      );

      const eventHookPayload = {
        name: hookName,
        events: {
          type: 'EVENT_TYPE',
          items:
            eventTypes.length > 0
              ? eventTypes
              : [
                  'user.lifecycle.create',
                  'user.lifecycle.activate',
                  'user.lifecycle.deactivate',
                  'user.lifecycle.suspend',
                  'user.lifecycle.unsuspend',
                  'user.lifecycle.update',
                  'user.lifecycle.delete',
                  'group.user_membership.add',
                  'group.user_membership.remove',
                  'group.lifecycle.create',
                  'group.lifecycle.update',
                  'group.lifecycle.delete',
                  'user.session.start',
                  'user.session.end',
                  'user.authentication.auth_failed',
                ],
        },
        channel: {
          type: 'HTTP',
          version: '1.0.0',
          config: {
            uri: context.webhookUrl,
            method: 'POST',
          },
        },
      };

      const saved = existingHook
        ? await makeOktaRequest(
            context.auth,
            `/eventHooks/${existingHook.id}`,
            HttpMethod.PUT,
            eventHookPayload
          )
        : await makeOktaRequest(
            context.auth,
            '/eventHooks',
            HttpMethod.POST,
            eventHookPayload
          );

      const hookId: string | undefined = saved.body?.id;
      if (!hookId) {
        throw new Error(
          'Failed to save event hook: ' + JSON.stringify(saved.body)
        );
      }
      await context.store.put('hookId', hookId);

      const { error: verifyError } = await tryCatch(() =>
        makeOktaRequest(
          context.auth,
          `/eventHooks/${hookId}/lifecycle/verify`,
          HttpMethod.POST
        )
      );
      if (verifyError) {
        await removeHook({ auth: context.auth, hookId });
        await context.store.delete('hookId');
        throw verifyError;
      }
    } catch (error) {
      console.error('Error creating Okta event hook:', error);
      throw new Error(`Failed to setup Okta event hook: ${error}`);
    }
  },

  async onDisable(context) {
    try {
      const hookId = await context.store.get<string>('hookId');

      if (hookId) {
        await removeHook({ auth: context.auth, hookId });
      }
      await context.store.delete('hookId');
    } catch (error) {
      console.error('Error cleaning up Okta event hook:', error);
    }
  },

  async run(context) {
    const payload: any = context.payload.body;
    const configuredEventTypes = context.propsValue.eventTypes || [];

    if (!payload.data?.events || !Array.isArray(payload.data.events)) {
      console.log('No events found in payload, skipping');
      return [];
    }

    const filteredEvents = [];

    for (const event of payload.data.events) {
      
      if (configuredEventTypes.length > 0) {
        if (!configuredEventTypes.includes(event.eventType)) {
          console.log(
            `Event type ${event.eventType} not in configured types, skipping`
          );
          continue;
        }
      }

     
      filteredEvents.push(event);
    }

    return filteredEvents;
  },

  async test(context) {
    try {
      const response = await makeOktaRequest(
        context.auth,
        '/logs?limit=1',
        HttpMethod.GET
      );
      return response.body || [];
    } catch (error) {
      console.error('Test error:', error);
      return [];
    }
  },

  sampleData: {
    eventId: 'evt_123456789',
    timestamp: new Date().toISOString(),
    version: '0',
    severity: 'INFO',
    eventType: 'user.lifecycle.create',
    displayMessage: 'User created: user@example.com',
    actor: {
      id: 'admin123',
      type: 'User',
      alternateId: 'admin@example.com',
      displayName: 'Admin User',
    },
    outcome: {
      result: 'SUCCESS',
      reason: '',
    },
    target: [
      {
        id: 'user123',
        type: 'User',
        alternateId: 'user@example.com',
        displayName: 'New User',
      },
    ],
  },
});

async function removeHook({ auth, hookId }: { auth: unknown; hookId: string }) {
  const { error: deactivateError } = await tryCatch(() =>
    makeOktaRequest(auth, `/eventHooks/${hookId}/lifecycle/deactivate`, HttpMethod.POST)
  );
  if (deactivateError) {
    console.warn('Failed to deactivate event hook:', deactivateError);
  }
  const { error: deleteError } = await tryCatch(() =>
    makeOktaRequest(auth, `/eventHooks/${hookId}`, HttpMethod.DELETE)
  );
  if (deleteError) {
    console.warn('Failed to delete event hook:', deleteError);
  }
}
