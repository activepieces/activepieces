// Action: Add Tag to Issue
import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown, tagDropdown, flattenObject } from '../common';

export const addTagToIssueAction = createAction({
  auth: youtrackAuth,
  name: 'add_tag_to_issue',
  displayName: 'Add Tag to Issue',
  description: 'Adds an existing tag to an issue.',
  props: { issue: issueDropdown, tag: tagDropdown },
  async run(context) {
    const a = context.auth as unknown as { baseUrl: string; apiToken: string };
    const r = await fetch(a.baseUrl.replace(/\/+$/, '') + '/api/issues/' + context.propsValue.issue + '/tags?fields=id,name', {
      method: HttpMethod.POST,
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + a.apiToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: context.propsValue.tag }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error('Failed: ' + JSON.stringify(data));
    return flattenObject(data);
  },
  sampleData: { id: '6-4', name: 'To deploy' },
});
