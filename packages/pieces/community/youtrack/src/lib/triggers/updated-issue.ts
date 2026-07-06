// Trigger: Updated Issue
import { AppConnectionValueForAuthProperty, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { ISSUE_FIELDS, flattenObject, youtrackApiCall } from '../common';

const polling: Polling<AppConnectionValueForAuthProperty<typeof youtrackAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const response = await youtrackApiCall<Array<Record<string, unknown>>>({
      baseUrl: auth.props.baseUrl,
      token: auth.props.apiToken,
      method: HttpMethod.GET,
      path: '/issues',
      queryParams: {
        fields: ISSUE_FIELDS,
        query: 'updated: {after ' + lastFetchEpochMS + '} AND created: {before ' + lastFetchEpochMS + '}',
        '$top': '50',
      },
    });
    return (response.body || []).map((issue) => ({
      epochMilliSeconds: (issue['updated'] as number) || (issue['created'] as number) || 0,
      data: flattenObject(issue),
    }));
  },
};

export const updatedIssueTrigger = createTrigger({
  auth: youtrackAuth,
  name: 'updated_issue',
  displayName: 'Updated Issue',
  description: 'Triggers when an existing issue is modified (summary, description, custom fields, etc.).',
  aiMetadata: {
    description: 'Fires when an existing issue is modified — its summary, description, custom fields, or other attributes change. Each event represents one updated issue (issues created within the same polling window are excluded). Use to react to changes on already-existing issues rather than brand-new ones.',
  },
  props: {},
  sampleData: {
    idReadable: 'SP-42', summary: 'Fixed login page crash', project_name: 'Sample Project',
    project_shortName: 'SP', reporter_name: 'Jane Doe', commentsCount: 3,
    created: 1644916724088, updated: 1648110830229,
  },
  type: TriggerStrategy.POLLING,
  async test(context) { return await pollingHelper.test(polling, context); },
  async onEnable(context) { await pollingHelper.onEnable(polling, context); },
  async onDisable(context) { await pollingHelper.onDisable(polling, context); },
  async run(context) { return await pollingHelper.poll(polling, context); },
});
