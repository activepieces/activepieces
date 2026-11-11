import { AppConnectionValueForAuthProperty, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { flattenIssue, getYoutrackUserTimeZoneId, formatYoutrackDateTimeLiteral } from '../common';
import { youtrackClient } from '../common/client';
import { issuePolling } from '../common/issue-polling';
import { newIssueTriggerOutputSchema } from '../output-schemas';


const polling: Polling<AppConnectionValueForAuthProperty<typeof youtrackAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    youtrackClient.connectionOf(auth);
    const epochOf = (issue: Record<string, unknown>) => issuePolling.epochField({ issue, key: 'created' });
    const toEvents = (issues: Record<string, unknown>[]) =>
      issues.map((issue) => ({ epochMilliSeconds: epochOf(issue), data: flattenIssue(issue) }));
    if (lastFetchEpochMS <= 0) {
      return toEvents(await issuePolling.fetchIssuePage({ auth, query: 'sort by: created desc', skip: 0 }));
    }
    const timeZoneId = await getYoutrackUserTimeZoneId({ auth });
    const since = formatYoutrackDateTimeLiteral({ epochMs: lastFetchEpochMS, timeZoneId });
    const issues = await issuePolling.collectNewIssues({ auth, query: `created: ${since} .. * sort by: created asc`, after: lastFetchEpochMS, epochOf });
    return toEvents(issues);
  },
};

export const newIssueTrigger = createTrigger({
  auth: youtrackAuth,
  name: 'new_issue',
  classification: 'READ',
  outputSchema: newIssueTriggerOutputSchema,
  displayName: 'New Issue',
  description: 'Triggers when a new issue is created in any project you can access.',
  aiMetadata: {
    description: 'Fires when a new issue is created in any YouTrack project the connected account can access. Each event represents one newly created issue with its summary, project, reporter, tags and field values.',
  },
  props: {},
  sampleData: {
    idReadable: 'SP-42',
    summary: 'Fix login page crash',
    description: 'Users cannot sign in after the latest deploy.',
    id: '3-19',
    project_id: '0-0',
    project_name: 'Sample Project',
    project_shortName: 'SP',
    reporter_id: '2-1',
    reporter_name: 'Jane Doe',
    reporter_login: 'jane.doe',
    customFields: {
      Priority: 'Critical',
      Type: 'Bug',
      State: 'To do',
      Assignee: null,
      Estimation: '2h',
    },
    created: 1644916724088,
    updated: 1644916724088,
    resolved: null,
    commentsCount: 0,
    votes: 0,
    tags: null,
  },
  type: TriggerStrategy.POLLING,
  async test(context) { return await pollingHelper.test(polling, context); },
  async onEnable(context) { await pollingHelper.onEnable(polling, context); },
  async onDisable(context) { await pollingHelper.onDisable(polling, context); },
  async run(context) { return await pollingHelper.poll(polling, context); },
});
