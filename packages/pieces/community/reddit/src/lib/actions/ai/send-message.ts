import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditSendMessageOutputSchema } from '../../output-schemas';

export const redditSendMessage = createAction({
  auth: redditAuth,
  name: 'reddit_send_message',
  outputSchema: redditSendMessageOutputSchema,
  displayName: 'Send Private Message',
  description: 'Sends a private message to a Reddit user or a subreddit\'s moderators.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sends a new private message to a user, or to a subreddit\'s moderators when To is "/r/<subreddit>". To reply within an existing conversation, use Create Comment with the message\'s t4_ fullname. Reddit does not return the new message id; find it with List Messages (folder = sent). Not idempotent. Needs the `privatemessages` scope: older connections must reconnect.',
    idempotent: false,
  },
  props: {
    to: Property.ShortText({ displayName: 'To', description: 'Recipient username without u/, or "/r/<subreddit>" for its moderators.', required: true }),
    subject: Property.ShortText({ displayName: 'Subject', description: 'Message subject (max 100 characters).', required: true }),
    text: Property.LongText({ displayName: 'Text', description: 'Markdown message body.', required: true }),
  },
  async run({ auth, propsValue }) {
    const to = propsValue.to.trim().startsWith('/r/') ? propsValue.to.trim() : redditApi.cleanUsername({ value: propsValue.to });
    await redditApi.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: '/api/compose',
      form: { api_type: 'json', to, subject: propsValue.subject, text: propsValue.text },
    });
    return { success: true, to, subject: propsValue.subject };
  },
});
