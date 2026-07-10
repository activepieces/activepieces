// Action: Remove Tag from Issue
import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown, tagDropdown, youtrackApiCall } from '../common';

export const removeTagFromIssueAction = createAction({
  auth: youtrackAuth,
  name: 'remove_tag_from_issue',
  displayName: 'Remove Tag from Issue',
  description: 'Removes a tag from an issue.',
  audience: 'both',
  aiMetadata: { description: 'Detach a tag from an issue, given both the issue ID and the tag ID. Idempotent: removing a tag that is not present has no further effect.', idempotent: true },
  props: {
    issue: issueDropdown,
    tag: tagDropdown,
  },
  async run(context) {
    const { baseUrl, apiToken } = context.auth.props;
    await youtrackApiCall({
      baseUrl,
      token: apiToken,
      method: HttpMethod.DELETE,
      path: '/issues/' + context.propsValue.issue + '/tags/' + context.propsValue.tag,
    });
    return { success: true };
  },
});
