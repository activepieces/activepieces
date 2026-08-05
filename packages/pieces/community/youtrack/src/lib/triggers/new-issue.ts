import { AppConnectionValueForAuthProperty, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import {
  ISSUE_FIELDS,
  flattenIssue,
  youtrackApiCall,
  requireYoutrackAuth,
  getYoutrackUserTimeZoneId,
  formatYoutrackDateTimeLiteral,
} from '../common';
import { newIssueTriggerOutputSchema } from '../output-schemas';

const PAGE_SIZE = 50;
/** At most 500 issues per poll; any remainder is picked up by the next poll. */
const MAX_PAGES = 10;

const polling: Polling<AppConnectionValueForAuthProperty<typeof youtrackAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
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
      issues.map((issue) => ({
        epochMilliSeconds: (issue['created'] as number) || 0,
        data: flattenIssue(issue),
      }));

    // Test Trigger passes no checkpoint: newest-first sample, a single page.
    if (lastFetchEpochMS <= 0) {
      return toEvents(await fetchPage('sort by: created desc', 0));
    }

    // `created: <datetime> .. *` filters server-side; YouTrack rejects the
    // `{after <epoch>}` form but accepts a range literal, parsed in the token
    // user's profile time zone (there is no way to mark it UTC), so the
    // checkpoint is rendered in that zone rather than assumed to be UTC.
    // Ascending order walks forward from the checkpoint, so a backlog bigger
    // than MAX_PAGES resumes in place next poll instead of being skipped.
    const timeZoneId = await getYoutrackUserTimeZoneId(baseUrl, apiToken);
    const since = formatYoutrackDateTimeLiteral(lastFetchEpochMS, timeZoneId);
    const query = `created: ${since} .. * sort by: created asc`;

    const collected: Array<Record<string, unknown>> = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const batch = await fetchPage(query, page * PAGE_SIZE);
      collected.push(...batch);
      if (batch.length < PAGE_SIZE) break;
    }

    return toEvents(collected);
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
