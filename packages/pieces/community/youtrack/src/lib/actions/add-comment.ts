import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { groupDropdown, issueDropdown } from '../common';
import { youtrackClient } from '../common/client';
import { addCommentActionOutputSchema } from '../output-schemas';

export const addCommentAction = createAction({
  auth: youtrackAuth,
  name: 'add_comment',
  classification: 'WRITE',
  outputSchema: addCommentActionOutputSchema,
  displayName: 'Add Comment',
  description: 'Adds a comment to an issue. Supports Markdown formatting.',
  audience: 'both',
  aiMetadata: {
    description:
      'Post a comment on an issue, given the issue ID and Markdown text; optionally restrict visibility to one group (group ID from List Groups). Use to add a note or reply on an issue. Not idempotent: each call appends a new comment.',
    idempotent: false,
  },
  props: {
    issue: issueDropdown,
    text: Property.LongText({
      displayName: 'Comment Text',
      description: 'The comment text. Use Markdown for formatting. Mention users with @username.',
      required: true,
    }),
    visibleToGroup: groupDropdown,
  },
  async run(context) {
    const body: Record<string, unknown> = { text: context.propsValue.text };
    const group = youtrackClient.optionalText(context.propsValue.visibleToGroup);
    if (group !== undefined) {
      body['visibility'] = { $type: 'LimitedVisibility', permittedGroups: [{ id: group }] };
    }
    const response = youtrackClient.recordOf(await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/issues/${youtrackClient.segment({ value: context.propsValue.issue, label: 'Issue' })}/comments`,
      query: { fields: 'id,text,author(name,login),created' },
      body,
      operation: 'add the comment',
    }));
    const author = youtrackClient.recordOf(response['author']);
    return {
      id: response['id'],
      text: response['text'],
      author_name: author['name'] ?? null,
      author_login: author['login'] ?? null,
      created: response['created'],
    };
  },
});
