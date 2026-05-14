// Trigger: Updated Issue
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { ISSUE_FIELDS, flattenObject } from '../common';

const polling: Polling<{ baseUrl: string; apiToken: string }, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const url = auth.baseUrl.replace(/\/+$/, '') + '/api/issues?fields=' +
      encodeURIComponent(ISSUE_FIELDS) +
      '&query=' + encodeURIComponent('updated: {after ' + new Date(lastFetchEpochMS).toISOString() + '}') +
      '&$top=50';
    const r = await fetch(url, {
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + auth.apiToken },
    });
    const data = await r.json() as Array<Record<string, unknown>>;
    if (!r.ok) throw new Error('Failed to fetch updated issues: ' + JSON.stringify(data));
    return (data || []).map((issue) => ({
      epochMilliSeconds: (issue.updated as number) || (issue.created as number) || 0,
      data: flattenObject(issue),
    }));
  },
};

export const updatedIssueTrigger = createTrigger({
  auth: youtrackAuth,
  name: 'updated_issue',
  displayName: 'Updated Issue',
  description: 'Triggers when an existing issue is modified (summary, description, custom fields, etc.).',
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
