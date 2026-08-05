// Trigger: Updated Issue
import { AppConnectionValueForAuthProperty, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { ISSUE_FIELDS, flattenIssue, youtrackApiCall, requireYoutrackAuth } from '../common';
import { updatedIssueTriggerOutputSchema } from '../output-schemas';

const PAGE_SIZE = 50;
/** At most 500 issues per poll; any remainder is picked up by the next poll. */
const MAX_PAGES = 10;

const polling: Polling<AppConnectionValueForAuthProperty<typeof youtrackAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  // Issues whose `updated` still equals `created` have never been modified, so
  // they belong to the New Issue trigger only.
  items: async ({ auth, lastFetchEpochMS }) => {
    const { baseUrl, apiToken } = requireYoutrackAuth(auth);

    const fetchPage = async (query: string, skip: number) => {
      const response = await youtrackApiCall<Array<Record<string, unknown>>>({
        baseUrl,
        token: apiToken,
        method: HttpMethod.GET,
        path: '/issues',
        queryParams: {
          fields: ISSUE_FIELDS,
          query,
          '$skip': String(skip),
          '$top': String(PAGE_SIZE),
        },
      });
      return response.body || [];
    };

    const toEvents = (issues: Array<Record<string, unknown>>) =>
      issues
        .filter((issue) => issue['updated'] !== issue['created'])
        .map((issue) => ({
          epochMilliSeconds: (issue['updated'] as number) || 0,
          data: flattenIssue(issue),
        }));

    // Test Trigger passes no checkpoint: newest-first sample, a single page.
    if (lastFetchEpochMS <= 0) {
      return toEvents(await fetchPage('sort by: updated desc', 0));
    }

    // Normal poll. `updated: <datetime> .. *` filters server-side (YouTrack has
    // no `{after <epoch>}` form — that 400s — but does accept an ISO datetime
    // range, honoured to the second), and ascending order walks the window from
    // the checkpoint forward. That combination is what makes this lossless: the
    // checkpoint only ever advances over issues actually returned, so a backlog
    // larger than MAX_PAGES simply resumes at the same place on the next poll
    // instead of being skipped. Truncating to whole seconds rounds the boundary
    // down, so the window is inclusive rather than one that could miss an issue.
    const since = new Date(lastFetchEpochMS).toISOString().slice(0, 19);
    const query = `updated: ${since} .. * sort by: updated asc`;

    const collected: Array<Record<string, unknown>> = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const batch = await fetchPage(query, page * PAGE_SIZE);
      collected.push(...batch);
      if (batch.length < PAGE_SIZE) break;
    }

    return toEvents(collected);
  },
};

export const updatedIssueTrigger = createTrigger({
  auth: youtrackAuth,
  name: 'updated_issue',
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
  },
  type: TriggerStrategy.POLLING,
  async test(context) { return await pollingHelper.test(polling, context); },
  async onEnable(context) { await pollingHelper.onEnable(polling, context); },
  async onDisable(context) { await pollingHelper.onDisable(polling, context); },
  async run(context) { return await pollingHelper.poll(polling, context); },
});
