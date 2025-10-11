import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { oktaAuth, makeOktaRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const newEventTrigger = createTrigger({
  auth: oktaAuth,
  name: 'new_event',
  displayName: 'New Event',
  description: 'Fires when a new Okta event is generated',
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
          { label: 'User Updated', value: 'user.lifecycle.update' },
          { label: 'User Deleted', value: 'user.lifecycle.delete' },
          { label: 'User Added to Group', value: 'group.user_membership.add' },
          { label: 'User Removed from Group', value: 'group.user_membership.remove' },
          { label: 'Group Created', value: 'group.lifecycle.create' },
          { label: 'Group Updated', value: 'group.lifecycle.update' },
          { label: 'Group Deleted', value: 'group.lifecycle.delete' },
          { label: 'User Login', value: 'user.session.start' },
          { label: 'User Logout', value: 'user.session.end' },
          { label: 'Authentication Failed', value: 'user.authentication.auth_failed' },
        ],
      },
    }),
    instructions: Property.MarkDown({
      value: `
## Setup Instructions

1. Copy the webhook URL below
2. Go to your Okta Admin Dashboard
3. Navigate to **Security** → **API** → **Hooks** (or **Event Hooks** depending on your Okta version)
4. Create a new webhook with the following settings:
   - **Name**: Activepieces Webhook
   - **URL**: {{webhookUrl}}
   - **Event Type**: Select the event types you want to monitor (or use all)
   - **Authentication**: None (Activepieces validates the webhook)
5. Test the webhook connection
6. Save and activate the webhook

The trigger will now fire whenever the selected Okta events occur.
      `,
    }),
  },
  async onEnable(context) {
    await context.store.put('webhookUrl', context.webhookUrl);
    await context.store.put('eventTypes', JSON.stringify(context.propsValue.eventTypes || []));
  },
  async onDisable(context) {
    await context.store.delete('webhookUrl');
    await context.store.delete('eventTypes');
  },
  async run(context) {
    const payload:any = context.payload.body;
    const storedEventTypes = JSON.parse(await context.store.get('eventTypes') || '[]');
    if (storedEventTypes && storedEventTypes.length > 0) {
      const eventType = payload.eventType || payload.data?.eventType;
      if (!storedEventTypes.includes(eventType)) {
        return [];
      }
    }

    return [payload];
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