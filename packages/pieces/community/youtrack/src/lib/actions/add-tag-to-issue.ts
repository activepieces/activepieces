import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { issueDropdown, tagDropdown, flattenObject } from '../common';
import { youtrackClient } from '../common/client';
import { addTagToIssueActionOutputSchema } from '../output-schemas';

export const addTagToIssueAction = createAction({
  auth: youtrackAuth,
  name: 'add_tag_to_issue',
  classification: 'WRITE',
  outputSchema: addTagToIssueActionOutputSchema,
  displayName: 'Add Tag to Issue',
  description: 'Adds an existing tag to an issue.',
  audience: 'both',
  aiMetadata: {
    description:
      'Attach an existing tag to an issue, given the issue ID and the tag ID (from List Tags); the tag must already exist (use Create Tag first if needed). Idempotent: adding a tag already present leaves the issue unchanged.',
    idempotent: true,
  },
  props: { issue: issueDropdown, tag: tagDropdown },
  async run(context) {
    const response = await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/issues/${youtrackClient.segment({ value: context.propsValue.issue, label: 'Issue' })}/tags`,
      query: { fields: 'id,name' },
      body: { id: youtrackClient.optionalText(context.propsValue.tag) },
      operation: 'add the tag to the issue',
    });
    return flattenObject({ obj: youtrackClient.recordOf(response) });
  },
});
