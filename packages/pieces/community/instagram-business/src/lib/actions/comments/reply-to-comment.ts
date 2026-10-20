import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { commentCreatedOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const replyToComment = createAction({
  auth: instagramCommon.authentication,
  outputSchema: commentCreatedOutputSchema,
  name: 'reply_to_comment',
  classification: 'WRITE',
  displayName: 'Reply to Comment',
  description: 'Reply to a comment on one of your Instagram posts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Replies to an existing Instagram comment, threading the response underneath it. Instagram supports only one level of threading, so replying to a reply attaches the response to the same parent. Not idempotent — each call posts another reply.',
    idempotent: false,
  },
  propertyGroups: [
    { key: 'account', display: 'section', label: 'Account', icon: 'user', props: ['page'] },
    { key: 'comment', display: 'section', label: 'Comment to reply to', icon: 'reply', props: ['comment_id'] },
    { key: 'reply', display: 'section', label: 'Reply', icon: 'text', props: ['message'] },
  ],
  props: {
    page: instagramCommon.page,
    comment_id: Property.ShortText({
      displayName: 'Comment ID',
      description: 'The id from List Comments or another comment step.',
      required: true,
      placeholder: '17858893269000001',
    }),
    message: Property.LongText({
      displayName: 'Text',
      required: true,
      placeholder: 'Thanks, glad you like it!',
    }),
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
