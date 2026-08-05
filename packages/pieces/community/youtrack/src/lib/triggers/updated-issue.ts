// Trigger: Updated Issue
import { AppConnectionValueForAuthProperty, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { ISSUE_FIELDS, flattenIssue, youtrackApiCall, requireYoutrackAuth } from '../common';
import { updatedIssueTriggerOutputSchema } from '../output-schemas';

const PAGE_SIZE = 50;
/** Ceiling of 500 issues per poll, so a stale checkpoint cannot page forever. */
const MAX_PAGES = 10;

const polling: Polling<AppConnectionValueForAuthProperty<typeof youtrackAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  // No date filter in the query: YouTrack search syntax has no `{after <epoch>}`
  // form (it 400s), so the cutoff is pollingHelper's, which drops items at or
  // below `lastFetchEpochMS`. Because that cutoff is client-side, a single page
  // would silently lose events whenever more than PAGE_SIZE issues are updated
  // between two polls. Page backwards until we reach an issue at or before the
  // checkpoint. Paging is decided on the raw batch, before the never-modified
  // filter below, so filtered-out rows cannot cut the window short.
  //
  // Issues whose `updated` still equals `created` have never been modified, so
  // they belong to the New Issue trigger only.
  items: async ({ auth, lastFetchEpochMS }) => {
    const { baseUrl, apiToken } = requireYoutrackAuth(auth);
    const collected: Array<Record<string, unknown>> = [];

    for (let page = 0; page < MAX_PAGES; page++) {
      const response = await youtrackApiCall<Array<Record<string, unknown>>>({
        baseUrl,
        token: apiToken,
        method: HttpMethod.GET,
        path: '/issues',
        queryParams: {
          fields: ISSUE_FIELDS,
          query: 'sort by: updated desc',
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
      if (batch.some((issue) => ((issue['updated'] as number) || 0) <= lastFetchEpochMS)) break;
    }

    return collected
      .filter((issue) => issue['updated'] !== issue['created'])
      .map((issue) => ({
        epochMilliSeconds: (issue['updated'] as number) || 0,
        data: flattenIssue(issue),
      }));
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
