import { AppConnectionValueForAuthProperty, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { flattenIssue, getYoutrackUserTimeZoneId, formatYoutrackDateTimeLiteral } from '../common';
import { youtrackClient } from '../common/client';
import { issuePolling } from '../common/issue-polling';
import { updatedIssueTriggerOutputSchema } from '../output-schemas';

const CREATED_VS_UPDATED_EPSILON_MS = 2000;

function isRealUpdate(issue: Record<string, unknown>): boolean {
  const created = issue['created'];
  const updated = issue['updated'];
  return typeof created === 'number' && typeof updated === 'number' && updated - created > CREATED_VS_UPDATED_EPSILON_MS;
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof youtrackAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    youtrackClient.connectionOf(auth);
    const epochOf = (issue: Record<string, unknown>) => issuePolling.epochField({ issue, key: 'updated' });
    const toEvents = (issues: Record<string, unknown>[]) =>
      issues
        .filter(isRealUpdate)
        .map((issue) => ({ epochMilliSeconds: epochOf(issue), data: flattenIssue(issue) }));
    if (lastFetchEpochMS <= 0) {
      return toEvents(await issuePolling.fetchIssuePage({ auth, query: 'sort by: updated desc', skip: 0 }));
    }
    const timeZoneId = await getYoutrackUserTimeZoneId({ auth });
    const since = formatYoutrackDateTimeLiteral({ epochMs: lastFetchEpochMS, timeZoneId });
    const issues = await issuePolling.collectNewIssues({ auth, query: `updated: ${since} .. * sort by: updated asc`, after: lastFetchEpochMS, epochOf, isEvent: isRealUpdate });
    return toEvents(issues);
  },
};

export const updatedIssueTrigger = createTrigger({
  auth: youtrackAuth,
  name: 'updated_issue',
  classification: 'READ',
  outputSchema: updatedIssueTriggerOutputSchema,
  displayName: 'Updated Issue',
  description: 'Triggers when an existing issue is modified (summary, description, custom fields, etc.).',
  aiMetadata: {
    description: 'Fires when an existing issue is modified — its summary, description, custom fields, or other attributes change. Each event represents one updated issue (issues created within the same polling window are excluded). Use to react to changes on already-existing issues rather than brand-new ones.',
  },
  props: {},
  sampleData: {
    idReadable: 'SP-42',
    summary: 'Fixed login page crash',
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
      State: 'Done',
      Assignee: 'John Smith',
      Estimation: '2h',
    },
    created: 1644916724088,
    updated: 1648110830229,
    resolved: 1648110830229,
    commentsCount: 3,
    votes: 0,
    tags: null,
  },
  type: TriggerStrategy.POLLING,
  async test(context) { return await pollingHelper.test(polling, context); },
  async onEnable(context) { await pollingHelper.onEnable(polling, context); },
  async onDisable(context) { await pollingHelper.onDisable(polling, context); },
  async run(context) { return await pollingHelper.poll(polling, context); },
});
