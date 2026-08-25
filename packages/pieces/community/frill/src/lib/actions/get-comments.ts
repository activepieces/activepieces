import { createAction, Property } from '@activepieces/pieces-framework';
import { frillAuth } from '../auth';
import { frillDropdowns, frillPaginatedApiCall, flattenObject } from '../common';

export const getComments = createAction({
  auth: frillAuth,
  name: 'get_comments',
  displayName: 'Get Comments',
  description: 'Fetch comments for a specific idea or all recent comments.',
  audience: 'both',
  aiMetadata: { description: 'Retrieves comments from Frill: scoped to a single idea when an idea ID is supplied, or all recent comments across ideas when left empty, up to the result limit (defaults to 20). Use to read discussion on feedback. Idempotent: read-only.', idempotent: true },
  props: {
    idea: frillDropdowns.ideaDropdownOptional,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of comments to return. Defaults to 20.',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      limit: context.propsValue.limit ?? 20,
    };
    if (context.propsValue.idea) {
      queryParams['idea_id'] = context.propsValue.idea;
    }

    const comments = await frillPaginatedApiCall<Record<string, unknown>>({
      token: context.auth.secret_text,
      path: '/comments',
      queryParams,
      limit: context.propsValue.limit ?? 20,
    });

    return comments.map((comment) => flattenObject(comment));
  },
});
