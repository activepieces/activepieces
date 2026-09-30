import { createTrigger, Property, StaticPropsValue, TriggerStrategy } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { ACTIVITY_EVENT_SAMPLE, reportsHelpers } from '../common/reports';

const props = {
  eventName: Property.ShortText({
    displayName: 'Event Name',
    description:
      'Only trigger on this event, e.g. CHANGE_PASSWORD or CREATE_ROLE. Leave empty for every admin event. Event names: https://developers.google.com/admin-sdk/reports/v1/appendix/activity/admin-event-names.',
    required: false,
  }),
};

const poller = reportsHelpers.createActivityPoller<StaticPropsValue<typeof props>>({
  getQuery: ({ eventName }) => ({ application: 'admin', eventName: eventName?.trim() || undefined }),
});

export const newAdminActivityEvent = createTrigger({
  auth: googleWorkspaceAdminAuth,
  name: 'new_admin_activity_event',
  classification: 'READ',
  displayName: 'New Admin Activity Event',
  description: 'Triggers when an admin makes a change in the Admin console.',
  aiMetadata: {
    description:
      'Fires once per Admin console audit log event (any admin change, or only the chosen event name). Events can appear a few minutes after they happen.',
  },
  props,
  type: TriggerStrategy.POLLING,
  sampleData: ACTIVITY_EVENT_SAMPLE,
  async test(context) {
    return poller.test(context);
  },
  async onEnable(context) {
    await poller.onEnable(context);
  },
  async onDisable() {
    return;
  },
  async run(context) {
    return poller.poll(context);
  },
});
