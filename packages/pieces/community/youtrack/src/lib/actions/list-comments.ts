import { createAction, Property } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../auth';
import { issueDropdown } from '../common';
import { youtrackClient } from '../common/client';
import { listCommentsActionOutputSchema } from '../output-schemas';

export const listCommentsAction = createAction({
  auth: youtrackAuth,
  name: 'list_comments',
  classification: 'SEARCH',
  outputSchema: listCommentsActionOutputSchema,
  displayName: 'List Comments',
  description: 'Lists all comments on an issue with author details and timestamps.',
  audience: 'both',
  aiMetadata: {
    description:
      'List the comments on an issue, given its ID, with author and timestamp details (up to Limit, default 100). Use to read the discussion on an issue or to find a comment ID for Update Comment or Delete Comment. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    issue: issueDropdown,
    limit: Property.Number({ displayName: 'Limit', description: 'Max comments. Default 100.', required: false, defaultValue: 100 }),
  },
  async run(context) {
    const items = await youtrackClient.listUpTo({
      auth: context.auth,
      path: `/issues/${youtrackClient.segment({ value: context.propsValue.issue, label: 'Issue' })}/comments`,
      query: { fields: 'id,text,author(name,login),created,updated' },
      limit: context.propsValue.limit,
      fallback: 100,
      operation: 'list comments',
    });
    return items.map((c) => {
      const author = youtrackClient.recordOf(c['author']);
      return {
        id: c['id'],
        text: c['text'],
        author_name: author['name'] ?? null,
        author_login: author['login'] ?? null,
        created: c['created'],
        updated: c['updated'],
      };
    });
  },
});
