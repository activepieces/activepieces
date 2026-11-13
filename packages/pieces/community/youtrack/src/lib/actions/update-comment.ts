import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { commentDropdown, issueDropdown, userSummary } from '../common';
import { youtrackClient } from '../common/client';
import { updateCommentActionOutputSchema } from '../output-schemas';

export const updateCommentAction = createAction({
  auth: youtrackAuth,
  name: 'update_comment',
  classification: 'WRITE',
  outputSchema: updateCommentActionOutputSchema,
  displayName: 'Update Comment',
  description: 'Replaces the text of a comment on an issue.',
  audience: 'both',
  aiMetadata: {
    description:
      'Replace the text of an existing comment, given the issue ID and the comment ID from List Comments; the new Markdown text replaces the old text completely. Idempotent: sending the same text again leaves the comment unchanged.',
    idempotent: true,
  },
  props: {
    issue: issueDropdown,
    comment: commentDropdown,
    text: Property.LongText({ displayName: 'Comment Text', description: 'The new comment text. Supports Markdown.', required: true }),
  },
  async run(context) {
    const text = youtrackClient.optionalText(context.propsValue.text);
    if (text === undefined) {
      throw new Error('Comment Text is required. Use Delete Comment to remove a comment.');
    }
    const issue = youtrackClient.segment({ value: context.propsValue.issue, label: 'Issue' });
    const comment = youtrackClient.segment({ value: context.propsValue.comment, label: 'Comment' });
    const response = youtrackClient.recordOf(await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/issues/${issue}/comments/${comment}`,
      query: { fields: 'id,text,author(id,name,login),created,updated' },
      body: { text: context.propsValue.text },
      operation: 'update the comment',
    }));
    const author = userSummary(response['author']);
    return {
      id: response['id'] ?? null,
      text: response['text'] ?? null,
      author_name: author.name,
      author_login: author.login,
      created: response['created'] ?? null,
      updated: response['updated'] ?? null,
    };
  },
});
