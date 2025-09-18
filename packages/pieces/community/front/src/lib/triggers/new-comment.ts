import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';

const polling: Polling<
  PiecePropValueSchema<typeof frontAuth>,
  { conversation_id: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const allComments: any[] = [];
    const comments = await makeRequest(
      auth.access_token,
      HttpMethod.GET,
      `/conversations/${propsValue.conversation_id}/comments`
    );
    for (const comment of comments._results || comments.results || []) {
      // Use posted_at (UNIX seconds, can be float) for dedupe
      const postedAtMs = Math.floor(Number(comment.posted_at) * 1000);
      if (!lastFetchEpochMS || postedAtMs > lastFetchEpochMS) {
        allComments.push({
          epochMilliSeconds: postedAtMs,
          data: { ...comment, conversation_id: propsValue.conversation_id },
        });
      }
    }
    return allComments;
  },
};

export const newComment = createTrigger({
  auth: frontAuth,
  name: 'newComment',
  displayName: 'New Comment',
  description: 'Fires when a new comment is posted on a conversation in Front.',
  props: {
    conversation_id: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'The ID of the conversation to monitor for new comments.',
      required: true,
    }),
  },
  sampleData: {
    id: 'com_1ywg3f2',
    body: "Sometimes I'll start a sentence and I don't even know where it's going. I just hope I find it along the way.",
    author: {
      id: 'tea_6r55a',
      email: 'michael.scott@dundermifflin.com',
      username: 'PrisonMike',
      first_name: 'Michael',
      last_name: 'Scott',
    },
    posted_at: 1698943401.378,
    conversation_id: 'cnv_y4xb93i',
    is_pinned: true,
    attachments: [
      {
        id: 'fil_3q8a7mby',
        filename: 'Andy_Anger_Management_Certificate.png',
        url: 'https://yourCompany.api.frontapp.com/download/fil_3q8a7mby',
        content_type: 'image/png',
        size: 4405,
      },
    ],
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});