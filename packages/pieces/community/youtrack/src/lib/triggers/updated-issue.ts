import { AppConnectionValueForAuthProperty, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { ISSUE_FIELDS, flattenIssue, getYoutrackUserTimeZoneId, formatYoutrackDateTimeLiteral } from '../common';
import { youtrackClient } from '../common/client';
import { updatedIssueTriggerOutputSchema } from '../output-schemas';

const PAGE_SIZE = 50;
const MAX_PAGES = 10;
const CREATED_VS_UPDATED_EPSILON_MS = 2000;

const polling: Polling<AppConnectionValueForAuthProperty<typeof youtrackAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    youtrackClient.connectionOf(auth);
    const epochOf = (issue: Record<string, unknown>) => epochField({ issue, key: 'updated' });
    const toEvents = (issues: Record<string, unknown>[]) =>
      issues
        .filter((issue) => {
          const created = issue['created'];
          const updated = issue['updated'];
          return typeof created === 'number' && typeof updated === 'number' && updated - created > CREATED_VS_UPDATED_EPSILON_MS;
        })
        .map((issue) => ({ epochMilliSeconds: epochOf(issue), data: flattenIssue(issue) }));
    if (lastFetchEpochMS <= 0) {
      return toEvents(await fetchPage({ auth, query: 'sort by: updated desc', skip: 0 }));
    }
    const timeZoneId = await getYoutrackUserTimeZoneId({ auth });
    const since = formatYoutrackDateTimeLiteral({ epochMs: lastFetchEpochMS, timeZoneId });
    const { issues, capped } = await collect({ auth, query: `updated: ${since} .. * sort by: updated asc` });
    return toEvents(capped ? withoutTrailingTies({ issues, epochOf }) : issues);
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

async function fetchPage({ auth, query, skip }: { auth: unknown; query: string; skip: number }): Promise<Record<string, unknown>[]> {
  const body = await youtrackClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: '/issues',
    query: { fields: ISSUE_FIELDS, query, $skip: skip, $top: PAGE_SIZE },
    operation: 'poll issues',
  });
  return youtrackClient.records(body);
}

async function collect({ auth, query }: { auth: unknown; query: string }): Promise<{ issues: Record<string, unknown>[]; capped: boolean }> {
  const collected: Record<string, unknown>[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const batch = await fetchPage({ auth, query, skip: page * PAGE_SIZE });
    collected.push(...batch);
    if (batch.length < PAGE_SIZE) return { issues: collected, capped: false };
  }
  return { issues: collected, capped: true };
}

function withoutTrailingTies({ issues, epochOf }: { issues: Record<string, unknown>[]; epochOf: (issue: Record<string, unknown>) => number }): Record<string, unknown>[] {
  if (issues.length === 0) return issues;
  const last = epochOf(issues[issues.length - 1]);
  const kept = issues.filter((issue) => epochOf(issue) < last);
  return kept.length === 0 ? issues : kept;
}

function epochField({ issue, key }: { issue: Record<string, unknown>; key: string }): number {
  const value = issue[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
