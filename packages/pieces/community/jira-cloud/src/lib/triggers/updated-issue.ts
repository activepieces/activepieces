import {
  PiecePropValueSchema,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  Polling,
  DedupeStrategy,
  pollingHelper,
} from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../auth';
import { searchIssuesByJql } from '../common';
import dayjs from 'dayjs';

const polling: Polling<
  PiecePropValueSchema<typeof jiraCloudAuth>,
  { jql?: string; sanitizeJql?: boolean }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS, propsValue }) => {
    const { jql, sanitizeJql } = propsValue;
    const searchQuery = `${jql ? jql + ' AND ' : ''}updated > '${dayjs(
      lastFetchEpochMS
    ).format('YYYY-MM-DD HH:mm')}'`;
    const issues = await searchIssuesByJql({
      auth,
      jql: searchQuery,
      maxResults: 50,
      sanitizeJql: sanitizeJql ?? false,
    });
    return issues.map((issue) => ({
      epochMilliSeconds: Date.parse(issue.fields.updated),
      data: issue,
    }));
  },
};

export const updatedIssue = createTrigger({
  name: 'updated_issue',
  displayName: 'Updated Issue',
  description: 'Triggers when an issue is updated',
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
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
});
