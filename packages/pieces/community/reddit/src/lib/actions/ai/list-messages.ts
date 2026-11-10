import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditListing } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditListMessagesOutputSchema } from '../../output-schemas';

export const redditListMessages = createAction({
  auth: redditAuth,
  name: 'reddit_list_messages',
  outputSchema: redditListMessagesOutputSchema,
  displayName: 'List Messages',
  description: 'Lists private messages, comment replies and mentions from your inbox.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists items from one inbox folder: everything (inbox), unread, sent, private messages only, comment replies, post replies (selfreply) or username mentions. Items are messages (t4_) or comments (t1_); `new` is true when unread. Listing does not mark items read; use Mark Messages Read. Needs the `privatemessages` scope: older connections must reconnect.',
    idempotent: true,
  },
  props: {
    folder: Property.StaticDropdown({
      displayName: 'Folder',
      description: 'Inbox folder (default inbox).',
      required: false,
      options: {
        options: [
          { label: 'Inbox (all)', value: 'inbox' },
          { label: 'Unread', value: 'unread' },
          { label: 'Sent', value: 'sent' },
          { label: 'Private Messages', value: 'messages' },
          { label: 'Comment Replies', value: 'comments' },
          { label: 'Post Replies', value: 'selfreply' },
          { label: 'Username Mentions', value: 'mentions' },
        ],
      },
    }),
    limit: redditAiProps.limit(),
    after: redditAiProps.after(),
  },
  async run({ auth, propsValue }) {
    const listing = await redditApi.request<RedditListing>({
      auth,
      method: HttpMethod.GET,
      path: `/message/${propsValue.folder ?? 'inbox'}`,
      query: { mark: 'false', limit: redditAiProps.clampLimit({ value: propsValue.limit }), after: propsValue.after },
    });
    const { items, ...page } = redditApi.toListing({ listing });
    return { messages: items, ...page };
  },
});
