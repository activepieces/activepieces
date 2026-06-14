// Trigger: New Issue
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
        query: 'created: {after ' + lastFetchEpochMS + '}',
        '$top': '50',
      },
    });
    return (response.body || []).map((issue) => ({
      epochMilliSeconds: (issue['created'] as number) || 0,
      data: flattenObject(issue),
    }));
  },
};

export const newIssueTrigger = createTrigger({
  auth: youtrackAuth,
  name: 'new_issue',
  displayName: 'New Issue',
  description: 'Triggers when a new issue is created in any project you can access.',
  aiMetadata: {
    description: 'Fires when a new issue is created in any YouTrack project the connected account can access. Each event represents one newly created issue with its summary, project, reporter, and field values.',
  },
  props: {},
  sampleData: {
    idReadable: 'SP-42', summary: 'Fix login page crash', project_name: 'Sample Project',
    project_shortName: 'SP', reporter_name: 'Jane Doe', commentsCount: 0,
    created: 1644916724088, updated: 1644916724088,
  },
  type: TriggerStrategy.POLLING,
  async test(context) { return await pollingHelper.test(polling, context); },
  async onEnable(context) { await pollingHelper.onEnable(polling, context); },
  async onDisable(context) { await pollingHelper.onDisable(polling, context); },
  async run(context) { return await pollingHelper.poll(polling, context); },
});
