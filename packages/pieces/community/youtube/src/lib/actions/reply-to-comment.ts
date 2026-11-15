import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { replyToCommentOutputSchema } from '../output-schemas';
import { youtubeClient } from '../common/client';

export const youtubeReplyToCommentAction = createAction({
  auth: youtubeAuth,
  outputSchema: replyToCommentOutputSchema,
  name: 'reply_to_comment',
  classification: 'WRITE',
  displayName: 'Reply To Comment',
  description: 'Reply to an existing top-level comment.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts a reply to an existing top-level YouTube comment via comments.insert, as the authenticated account. Use Post Video Comment to start a new thread instead. The parent must be a top-level comment ID from List Comment Threads — YouTube has no nested replies, so replying to a reply fails — and each call posts another reply.',
    idempotent: false,
  },
  props: {
    parentCommentId: Property.ShortText({
      displayName: 'Parent Comment ID',
      description:
        'The ID of a top-level comment, from `items[].snippet.topLevelComment.id` in List Comment Threads. Reply IDs are not accepted.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Reply Text',
      description: 'The reply body to post.',
      required: true,
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const { parentCommentId, text } = context.propsValue;

    return youtubeClient.sendRequest({
      accessToken,
      method: HttpMethod.POST,
      path: '/comments',
      operation: 'Reply To Comment',
      queryParams: { part: 'snippet' },
      body: {
        snippet: { parentId: parentCommentId, textOriginal: text },
      },
    });
  },
});
