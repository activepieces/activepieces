import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { ACTIVITY_EVENT_SAMPLE, reportsHelpers } from '../common/reports';

const poller = reportsHelpers.createActivityPoller<Record<string, unknown>>({
  getQuery: () => ({ application: 'admin', eventName: 'CREATE_GROUP' }),
});

export const newGroup = createTrigger({
  auth: googleWorkspaceAdminAuth,
  name: 'new_group',
  classification: 'READ',
  displayName: 'New Group',
  description: 'Triggers when a new group is created.',
  aiMetadata: {
    description:
      'Fires once per group created in Google Workspace, read from the Admin console audit log; group_email holds the new group. Events can appear a few minutes after creation.',
  },
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    ...ACTIVITY_EVENT_SAMPLE,
    event_type: 'GROUP_SETTINGS',
    event_name: 'CREATE_GROUP',
    user_email: null,
    group_email: 'marketing@yourcompany.com',
    parameters: { GROUP_EMAIL: 'marketing@yourcompany.com' },
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
