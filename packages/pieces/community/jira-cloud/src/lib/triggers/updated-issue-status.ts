import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { createJiraPolling } from '../common/polling';

const polling = createJiraPolling({ epochField: 'statuscategorychangedate' });

export const updatedIssueStatus = createTrigger({
  name: 'updated_issue_status',
  displayName: 'Updated Issue Status',
  description: 'Triggers when an issue status is updated',
  aiMetadata: {
    description:
      "Fires when a Jira issue's status changes (e.g. To Do -> In Progress -> Done), optionally limited to issues matching a JQL filter. Each event represents one issue whose status was updated and includes the issue's current field data. Polling-based; events arrive on the next poll, not instantly.",
  },
  auth: jiraCloudAuth,
  type: TriggerStrategy.POLLING,
  props: {
    jql: Property.LongText({
      displayName: 'JQL',
      description: 'Use to filter issues watched',
      required: false,
    }),
    sanitizeJql: Property.Checkbox({
      displayName: 'Sanitize JQL',
      required: false,
      defaultValue: true,
    }),
  },
  sampleData: {},
  async onEnable(context) {
    await polling.onEnable({ context });
  },
  async onDisable() {
    return;
  },
  async run(context) {
    return await polling.poll({ context });
  },
  async test(context) {
    return await polling.test({ context });
  },
});
