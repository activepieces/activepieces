import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { listCommentsOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown, COMMENT_FIELDS } from '../../common';

export const listCommentReplies = createAction({
  auth: instagramCommon.authentication,
  outputSchema: listCommentsOutputSchema,
  name: 'list_comment_replies',
  classification: 'READ',
  displayName: 'List Comment Replies',
  description: 'List the replies to one comment.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the replies made to one Instagram comment, given the parent comment id. A comment with no replies returns an empty list. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page: instagramCommon.page,
    comment_id: Property.ShortText({
      displayName: 'Parent Comment ID',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;

    const response = await instagramCommon.graphRequest<{ data?: unknown[] }>({
      method: HttpMethod.GET,
      resourceUri: `/${propsValue.comment_id}/replies`,
      accessToken: page.accessToken,
      query: { fields: COMMENT_FIELDS },
    });

    const comments = response.data ?? [];
    return { comments, count: comments.length };
  },
});
