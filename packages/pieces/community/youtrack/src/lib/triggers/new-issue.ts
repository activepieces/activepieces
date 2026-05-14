// Trigger: New Issue
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { ISSUE_FIELDS, flattenObject } from '../common';

const polling: Polling<{ baseUrl: string; apiToken: string }, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const url = auth.baseUrl.replace(/\/+$/, '') + '/api/issues?fields=' +
      encodeURIComponent(ISSUE_FIELDS) +
      '&query=' + encodeURIComponent('created: {after ' + new Date(lastFetchEpochMS).toISOString() + '}') +
      '&$top=50';
    const r = await fetch(url, {
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + auth.apiToken },
    });
    const data = await r.json() as Array<Record<string, unknown>>;
    if (!r.ok) throw new Error('Failed to fetch new issues: ' + JSON.stringify(data));
    return (data || []).map((issue) => ({
      epochMilliSeconds: (issue.created as number) || 0,
      data: flattenObject(issue),
    }));
  },
};

export const newIssueTrigger = createTrigger({
  auth: youtrackAuth,
  name: 'new_issue',
  displayName: 'New Issue',
  description: 'Triggers when a new issue is created in any project you can access.',
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
