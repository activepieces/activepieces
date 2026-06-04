import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown, tagDropdown, flattenObject, youtrackApiCall } from '../common';

export const addTagToIssueAction = createAction({
  auth: youtrackAuth,
  name: 'add_tag_to_issue',
  displayName: 'Add Tag to Issue',
  description: 'Adds an existing tag to an issue.',
  props: { issue: issueDropdown, tag: tagDropdown },
  async run(context) {
    const { baseUrl, apiToken } = context.auth.props;
    const response = await youtrackApiCall<Record<string, unknown>>({
      baseUrl,
      token: apiToken,
      method: HttpMethod.POST,
      path: '/issues/' + context.propsValue.issue + '/tags',
      queryParams: { fields: 'id,name' },
      body: { id: context.propsValue.tag },
    });
    return flattenObject(response.body);
  },
});
