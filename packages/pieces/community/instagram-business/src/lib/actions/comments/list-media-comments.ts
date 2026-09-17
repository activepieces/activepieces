import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { listCommentsOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown, COMMENT_FIELDS } from '../../common';

export const listMediaComments = createAction({
  auth: instagramCommon.authentication,
  outputSchema: listCommentsOutputSchema,
  name: 'list_media_comments',
  classification: 'READ',
  displayName: 'List Comments',
  description: 'List the top-level comments on one Instagram post.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the top-level comments on one Instagram post, with author, text, timestamp, like count and whether the comment is hidden. Replies are not included — use List Comment Replies for those. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page: instagramCommon.page,
    media_id: Property.ShortText({
      displayName: 'Media ID',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of comments to return (default 25).',
      required: false,
    }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;

    const response = await instagramCommon.graphRequest<{
      data?: unknown[];
      paging?: { cursors?: { after?: string } };
    }>({
      method: HttpMethod.GET,
      resourceUri: `/${propsValue.media_id}/comments`,
      accessToken: page.accessToken,
      query: { fields: COMMENT_FIELDS, limit: propsValue.limit ?? 25 },
    });

    const comments = response.data ?? [];
    return {
      comments,
      count: comments.length,
      next_cursor: response.paging?.cursors?.after,
    };
  },
});
