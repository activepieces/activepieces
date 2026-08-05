// Trigger: New Issue
import { AppConnectionValueForAuthProperty, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { ISSUE_FIELDS, flattenIssue, youtrackApiCall } from '../common';
import { newIssueTriggerOutputSchema } from '../output-schemas';

const PAGE_SIZE = 50;
/** Ceiling of 500 issues per poll, so a stale checkpoint cannot page forever. */
const MAX_PAGES = 10;

const polling: Polling<AppConnectionValueForAuthProperty<typeof youtrackAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  // No date filter in the query: YouTrack search syntax has no `{after <epoch>}`
  // form (it 400s), so the cutoff is pollingHelper's, which drops items at or
  // below `lastFetchEpochMS`. Because that cutoff is client-side, a single page
  // would silently lose events whenever more than PAGE_SIZE issues are created
  // between two polls: the newest page is returned, the checkpoint advances past
  // the rest, and they are never seen again. Page backwards until we reach an
  // issue at or before the checkpoint, so the whole window is covered.
  items: async ({ auth, lastFetchEpochMS }) => {
    const collected: Array<Record<string, unknown>> = [];

    for (let page = 0; page < MAX_PAGES; page++) {
      const response = await youtrackApiCall<Array<Record<string, unknown>>>({
        baseUrl: auth.props.baseUrl,
        token: auth.props.apiToken,
        method: HttpMethod.GET,
        path: '/issues',
        queryParams: {
          fields: ISSUE_FIELDS,
          query: 'sort by: created desc',
          '$skip': String(page * PAGE_SIZE),
          '$top': String(PAGE_SIZE),
        },
      });

      const batch = response.body || [];
      collected.push(...batch);

      // No checkpoint yet (Test Trigger passes 0) — one page is enough.
      if (lastFetchEpochMS <= 0) break;
      // Exhausted the project, or paged back past the checkpoint.
      if (batch.length < PAGE_SIZE) break;
      if (batch.some((issue) => ((issue['created'] as number) || 0) <= lastFetchEpochMS)) break;
    }

    return collected.map((issue) => ({
      epochMilliSeconds: (issue['created'] as number) || 0,
      data: flattenIssue(issue),
    }));
  },
};

export const newIssueTrigger = createTrigger({
  auth: youtrackAuth,
  name: 'new_issue',
  outputSchema: newIssueTriggerOutputSchema,
  displayName: 'New Issue',
  description: 'Triggers when a new issue is created in any project you can access.',
  aiMetadata: {
    description: 'Fires when a new issue is created in any YouTrack project the connected account can access. Each event represents one newly created issue with its summary, project, reporter, and field values.',
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
  },
  type: TriggerStrategy.POLLING,
  async test(context) { return await pollingHelper.test(polling, context); },
  async onEnable(context) { await pollingHelper.onEnable(polling, context); },
  async onDisable(context) { await pollingHelper.onDisable(polling, context); },
  async run(context) { return await pollingHelper.poll(polling, context); },
});
