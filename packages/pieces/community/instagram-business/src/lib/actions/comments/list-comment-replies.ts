import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { listCommentsOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown, COMMENT_FIELDS } from '../../common';

export const listCommentReplies = createAction({
  auth: instagramCommon.authentication,
  outputSchema: listCommentsOutputSchema,
  name: 'list_comment_replies',
  classification: 'SEARCH',
  displayName: 'List Comment Replies',
  description: 'List the replies to one comment.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the replies made to one Instagram comment, given the parent comment id. A comment with no replies returns an empty list. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'account', display: 'section', label: 'Account', icon: 'user', props: ['page'] },
    { key: 'comment', display: 'section', label: 'Parent comment', icon: 'reply', props: ['comment_id'] },
  ],
  props: {
    page: instagramCommon.page,
    comment_id: Property.ShortText({
      displayName: 'Comment ID',
      description: 'The comment whose replies to list, from List Comments.',
      required: true,
      placeholder: '17858893269000001',
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
