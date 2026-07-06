import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown, ISSUE_FIELDS, flattenObject, youtrackApiCall } from '../common';

export const getIssueAction = createAction({
  auth: youtrackAuth,
  name: 'get_issue',
  displayName: 'Get Issue',
  description: 'Retrieves full details of an issue including all custom field values.',
  audience: 'both',
  aiMetadata: { description: 'Fetch the full details of a single issue by its ID, including summary, description, and all custom field values. Use to read the current state of a known issue. Read-only and idempotent.', idempotent: true },
  props: { issue: issueDropdown },
  async run(context) {
    const { baseUrl, apiToken } = context.auth.props;
    const response = await youtrackApiCall<Record<string, unknown>>({
      baseUrl,
      token: apiToken,
      method: HttpMethod.GET,
      path: '/issues/' + context.propsValue.issue,
      queryParams: { fields: ISSUE_FIELDS },
    });
    return flattenObject(response.body);
  },
});
