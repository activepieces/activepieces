import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditSetInboxRepliesOutputSchema } from '../../output-schemas';

export const redditSetInboxReplies = createAction({
  auth: redditAuth,
  name: 'reddit_set_inbox_replies',
  outputSchema: redditSetInboxRepliesOutputSchema,
  displayName: 'Set Inbox Replies',
  description: 'Turns inbox notifications for replies to one of your posts or comments on or off.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Enables or disables inbox notifications for replies to a post (t3_) or comment (t1_) you authored. The id must carry its type prefix.',
    idempotent: true,
  },
  props: {
    thing_id: Property.ShortText({ displayName: 'Fullname', description: 'Fullname of your post or comment, e.g. "t3_abc123".', required: true }),
    enabled: Property.StaticDropdown({
      displayName: 'Inbox Replies',
      description: 'Whether replies should notify your inbox.',
      required: true,
      options: {
        options: [
          { label: 'Enabled', value: 'true' },
          { label: 'Disabled', value: 'false' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const id = redditApi.requireFullname({ value: propsValue.thing_id, label: 'Fullname' });
    await redditApi.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: '/api/sendreplies',
      form: { id, state: propsValue.enabled },
    });
    return { success: true, id, inbox_replies: propsValue.enabled === 'true' };
  },
});
