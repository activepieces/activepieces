import { createTrigger, Property, StaticPropsValue, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { googleWorkspaceAdminAuth } from '../auth';
import { ACTIVITY_EVENT_SAMPLE, ActivityEvent, reportsHelpers } from '../common/reports';

const props = {
  eventType: Property.StaticDropdown({
    displayName: 'Event Type',
    required: true,
    defaultValue: 'created',
    options: {
      options: [
        { label: 'User created', value: 'created' },
        { label: 'User deleted', value: 'deleted' },
        { label: 'User restored (undeleted)', value: 'undeleted' },
        { label: 'Admin status changed', value: 'admin_status_changed' },
        { label: 'User updated', value: 'updated' },
      ],
    },
  }),
};

const polling = reportsHelpers.createActivityPolling<StaticPropsValue<typeof props>>({
  getQuery: ({ eventType }) => {
    const eventNames = EVENT_NAMES_BY_TYPE[eventType];
    return {
      application: 'admin',
      eventName: eventNames?.length === 1 ? eventNames[0] : undefined,
      filter: (event: ActivityEvent) =>
        eventNames
          ? eventNames.includes(event.event_name)
          : event.event_type === 'USER_SETTINGS' && !NON_UPDATE_EVENTS.includes(event.event_name),
    };
  },
});

export const newUserEvent = createTrigger({
  auth: googleWorkspaceAdminAuth,
  name: 'new_user_event',
  classification: 'READ',
  displayName: 'New User Event',
  description: 'Triggers when a user is created, deleted, restored, updated or has their admin status changed.',
  aiMetadata: {
    description:
      'Fires once per matching user event in the Admin console audit log (created, deleted, restored, admin status changed, or any other user setting update). Events can appear in the audit log a few minutes after they happen.',
  },
  props,
  type: TriggerStrategy.POLLING,
  sampleData: ACTIVITY_EVENT_SAMPLE,
  async test(context) {
    return pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
});

const EVENT_NAMES_BY_TYPE: Record<string, string[] | undefined> = {
  created: ['CREATE_USER'],
  deleted: ['DELETE_USER'],
  undeleted: ['UNDELETE_USER'],
  admin_status_changed: ['GRANT_ADMIN_PRIVILEGE', 'REVOKE_ADMIN_PRIVILEGE', 'ASSIGN_ROLE', 'UNASSIGN_ROLE'],
};

const NON_UPDATE_EVENTS = ['CREATE_USER', 'DELETE_USER', 'UNDELETE_USER', 'GRANT_ADMIN_PRIVILEGE', 'REVOKE_ADMIN_PRIVILEGE'];
