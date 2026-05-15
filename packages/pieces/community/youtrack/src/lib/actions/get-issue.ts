// Action: Get Issue
import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown, ISSUE_FIELDS, flattenObject } from '../common';

export const getIssueAction = createAction({
  auth: youtrackAuth,
  name: 'get_issue',
  displayName: 'Get Issue',
  description: 'Retrieves full details of an issue including all custom field values.',
  props: { issue: issueDropdown },
  async run(context) {
    const a = context.auth as unknown as { baseUrl: string; apiToken: string };
    const url = a.baseUrl.replace(/\/+$/, '') + '/api/issues/' + context.propsValue.issue + '?fields=' + encodeURIComponent(ISSUE_FIELDS);
    const r = await fetch(url, {
      method: HttpMethod.GET,
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + a.apiToken },
    });
    if (!r.ok) { const errText = await r.text().catch(() => String(r.status)); throw new Error('Failed to get issue: ' + errText); }
    const data = await r.json();
    return flattenObject(data);
  },
  sampleData: {
    idReadable: 'SP-42', summary: 'Fix login page crash', project_name: 'Sample Project',
    reporter_name: 'Jane Doe', reporter_login: 'jane.doe', commentsCount: 3, votes: 5,
    created: 1644916724088, updated: 1648110830229,
  },
});
