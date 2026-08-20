import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { jiraPolling } from '../common/polling';

export const updatedIssue = createTrigger({
  name: 'updated_issue',
  displayName: 'Updated Issue',
  description: 'Triggers when an issue is updated',
  aiMetadata: {
    description:
      'Fires when any field of a Jira issue is updated (status, assignee, summary, etc.), optionally limited to issues matching a JQL filter. Each event represents one updated issue with its current field data; it does not include a diff of what changed. Polling-based; events arrive on the next poll, not instantly.',
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
      defaultValue: false,
    }),
  },
  sampleData: {},
  async onEnable(context) {
    await jiraPolling.onEnable({ context });
  },
  async onDisable() {
    return;
  },
  async run(context) {
    return await jiraPolling.poll({ context });
  },
  async test(context) {
    return await jiraPolling.test({ context });
  },
});
