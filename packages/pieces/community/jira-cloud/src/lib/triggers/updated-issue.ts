import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  Polling,
  DedupeStrategy,
  pollingHelper,
} from '@activepieces/pieces-common';
import { JiraAuth, jiraCloudAuth } from '../../auth';
import {
  fetchAllIssuesByJql,
  filterUnseenPollingItems,
  floorToJqlMinuteEpochMilliSeconds,
  formatJqlDateTime,
  getJiraProfileTimeZone,
  getPollingLookbackWindowStartEpochMilliSeconds,
  toPollingCheckpointSafeEpochMilliSeconds,
} from '../common';

type PolledIssue = {
  id: string;
  fields: { updated: string } & Record<string, unknown>;
} & Record<string, unknown>;

const polling: Polling<   JiraAuth,
  { jql?: string; sanitizeJql?: boolean }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, store, lastFetchEpochMS, propsValue }) => {
    const { jql, sanitizeJql } = propsValue;
    const sinceEpochMilliSeconds = getPollingLookbackWindowStartEpochMilliSeconds(lastFetchEpochMS);
    const timeZone = await getJiraProfileTimeZone({ auth });
    const since = formatJqlDateTime({ epochMilliSeconds: sinceEpochMilliSeconds, timeZone });
    const searchQuery = `${jql ? jql + ' AND ' : ''}updated > '${since}'`;

    const issues = await fetchAllIssuesByJql<PolledIssue>({
      auth,
      jql: searchQuery,
      sanitizeJql: sanitizeJql ?? false,
      orderByClause: 'ORDER BY updated ASC',
    });

    const unseenIssues = await filterUnseenPollingItems({
      store,
      storeKey: 'updatedIssueSeenIds',
      items: issues,
      getId: (issue) => issue.id,
      getEpochMilliSeconds: (issue) => Date.parse(issue.fields.updated),
      pruneBeforeEpochMilliSeconds: floorToJqlMinuteEpochMilliSeconds(sinceEpochMilliSeconds),
      suppressEmitAtOrBelowEpochMilliSeconds: lastFetchEpochMS,
    });

    return unseenIssues.map((issue) => ({
      epochMilliSeconds: toPollingCheckpointSafeEpochMilliSeconds({
        epochMilliSeconds: Date.parse(issue.fields.updated),
        lastFetchEpochMS,
      }),
      data: issue,
    }));
  },
};

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
