import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { oktaAuth } from '../../index';
import { oktaApiCall, OktaAuthValue } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

export const oktaNewEventTrigger = createTrigger({
  auth: oktaAuth,
  name: 'okta_new_event',
  displayName: 'New Event',
  description: 'Triggers when a new Okta event is generated (any configured event type)',
  type: TriggerStrategy.POLLING,
  props: {
    eventType: Property.StaticMultiSelectDropdown({
      displayName: 'Event Types',
      description: 'Select the event types to monitor (leave empty for all events)',
      required: false,
      options: {
        options: [
          { label: 'User Created', value: 'user.lifecycle.create' },
          { label: 'User Activated', value: 'user.lifecycle.activate' },
          { label: 'User Deactivated', value: 'user.lifecycle.deactivate' },
          { label: 'User Suspended', value: 'user.lifecycle.suspend' },
          { label: 'User Unsuspended', value: 'user.lifecycle.unsuspend' },
          { label: 'User Updated', value: 'user.lifecycle.update' },
          { label: 'User Login', value: 'user.session.start' },
          { label: 'User Logout', value: 'user.session.end' },
          { label: 'User Added to Group', value: 'group.user_membership.add' },
          { label: 'User Removed from Group', value: 'group.user_membership.remove' },
          { label: 'Group Created', value: 'group.lifecycle.create' },
          { label: 'Group Updated', value: 'group.lifecycle.update' },
          { label: 'Group Deactivated', value: 'group.lifecycle.deactivate' },
          { label: 'Application Created', value: 'application.lifecycle.create' },
          { label: 'Application Updated', value: 'application.lifecycle.update' },
          { label: 'Application Deactivated', value: 'application.lifecycle.deactivate' },
        ],
      },
    }),
  },
  sampleData: {
    uuid: '2b32b64c-65d8-4e6a-9d7c-5e3a1b4c8d2e',
    published: '2023-10-09T12:34:56.789Z',
    eventType: 'user.lifecycle.create',
    version: '0',
    severity: 'INFO',
    displayMessage: 'Create user',
    actor: {
      id: '00u1a2b3c4d5e6f7g8h9',
      type: 'User',
      alternateId: 'admin@example.com',
      displayName: 'Admin User',
    },
    client: {
      userAgent: {
        rawUserAgent: 'Mozilla/5.0',
        os: 'Windows',
        browser: 'CHROME',
      },
      geographicalContext: {
        city: 'San Francisco',
        state: 'California',
        country: 'United States',
      },
      ipAddress: '192.168.1.1',
    },
    outcome: {
      result: 'SUCCESS',
    },
    target: [
      {
        id: '00u9a8b7c6d5e4f3g2h1',
        type: 'User',
        alternateId: 'john.doe@example.com',
        displayName: 'John Doe',
      },
    ],
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});

const polling: Polling<OktaAuthValue, { eventType?: string[] }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const authValue = auth as OktaAuthValue;
    const currentTimestamp = new Date().toISOString();
    
    // Use last fetch time or 24 hours ago
    const since = lastFetchEpochMS 
      ? new Date(lastFetchEpochMS).toISOString()
      : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const query: Record<string, string> = {
      since,
      sortOrder: 'ASCENDING',
      limit: '100',
    };

    // Add event type filter if specified
    if (propsValue.eventType && propsValue.eventType.length > 0) {
      query.filter = `eventType eq "${propsValue.eventType.join('" or eventType eq "')}"`;
    }

    const response = await oktaApiCall({
      auth: authValue,
      method: HttpMethod.GET,
      resourceUri: '/api/v1/logs',
      query,
    });

    const events = response.body as any[];
    
    return events.map((event: any) => ({
      epochMilliSeconds: new Date(event.published).getTime(),
      data: event,
    }));
  },
};

