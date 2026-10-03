import { createTrigger, Property, StaticPropsValue, TriggerStrategy } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { ACTIVITY_EVENT_SAMPLE, REPORT_APPLICATIONS, reportsHelpers } from '../common/reports';

const props = {
  application: Property.StaticDropdown({
    displayName: 'Application',
    required: true,
    defaultValue: 'login',
    options: { options: REPORT_APPLICATIONS },
  }),
  eventName: Property.ShortText({
    displayName: 'Event Name',
    description:
      'Only trigger on this event, e.g. login_failure for Login or download for Drive. Leave empty for every event. Event names per app: https://developers.google.com/admin-sdk/reports/v1/reference/activities/list.',
    required: false,
  }),
};

const poller = reportsHelpers.createActivityPoller<StaticPropsValue<typeof props>>({
  getQuery: ({ application, eventName }) => ({ application, eventName: eventName?.trim() || undefined }),
});

export const newApplicationActivityEvent = createTrigger({
  auth: googleWorkspaceAdminAuth,
  name: 'new_application_activity_event',
  classification: 'READ',
  displayName: 'New Application Activity Event',
  description: 'Triggers on activity in a Workspace app, e.g. a failed login or a Drive file download.',
  aiMetadata: {
    description:
      "Fires once per audit log event from the chosen Workspace application (Login, Drive, Calendar, Meet, Token, ...), optionally only for one event name. Some apps' logs lag by up to a few hours.",
  },
  props,
  type: TriggerStrategy.POLLING,
  sampleData: {
    ...ACTIVITY_EVENT_SAMPLE,
    application: 'login',
    event_type: 'login',
    event_name: 'login_failure',
    actor_email: 'jane.doe@yourcompany.com',
    user_email: null,
    parameters: { login_type: 'google_password', login_failure_type: 'login_failure_invalid_password' },
  },
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
