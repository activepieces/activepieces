import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { commentCreatedOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const replyToComment = createAction({
  auth: instagramCommon.authentication,
  outputSchema: commentCreatedOutputSchema,
  name: 'reply_to_comment',
  classification: 'WRITE',
  displayName: 'Reply To Comment',
  description: 'Reply to a comment on one of your Instagram posts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Replies to an existing Instagram comment, threading the response underneath it. Instagram supports only one level of threading, so replying to a reply attaches the response to the same parent. Not idempotent — each call posts another reply.',
    idempotent: false,
  },
  props: {
    page: instagramCommon.page,
    comment_id: Property.ShortText({ displayName: 'Comment ID', required: true }),
    message: Property.LongText({ displayName: 'Reply', required: true }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;

    const created = await instagramCommon.graphRequest<{ id?: string }>({
      method: HttpMethod.POST,
      resourceUri: `/${propsValue.comment_id}/replies`,
      accessToken: page.accessToken,
      body: { message: propsValue.message },
    });

    return { id: created.id, parent_id: propsValue.comment_id };
  },
});
