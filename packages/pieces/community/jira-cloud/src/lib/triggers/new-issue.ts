import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { createJiraPolling } from '../common/polling';

const polling = createJiraPolling({ timeField: 'created' });

export const newIssue = createTrigger({
  name: 'new_issue',
  displayName: 'New Issue',
  description: 'Triggers when a new issue is created',
  aiMetadata: {
    description:
      'Fires when a new Jira issue is created, optionally limited to issues matching a JQL filter. Each event represents one newly created issue with its full field data (summary, project, type, status, reporter, etc.). Polling-based; events arrive on the next poll, not instantly.',
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
