import { createTrigger, TriggerStrategy, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import { frillAuth } from '../auth';
import { frillApiCall } from '../common';

const polling: Polling<AppConnectionValueForAuthProperty<typeof frillAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const response = await frillApiCall<{
      data: {
        idx: string;
        message: string;
        content_html: string;
        content_markdown: string;
        is_private: boolean;
        type: string;
        created_at: string;
        updated_at: string;
        follower: { name: string; email: string };
        idea_id: number;
      }[];
    }>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: '/comments',
      queryParams: { limit: 100 },
    });

    return response.body.data.map((item) => ({
      epochMilliSeconds: new Date(item.created_at).getTime(),
      data: {
        idx: item.idx,
        message: item.message ?? null,
        content_html: item.content_html ?? null,
        content_markdown: item.content_markdown ?? null,
        is_private: item.is_private ?? false,
        type: item.type ?? null,
        created_at: item.created_at,
        updated_at: item.updated_at ?? null,
        follower_name: item.follower?.name ?? null,
        follower_email: item.follower?.email ?? null,
        idea_id: item.idea_id ?? null,
      },
    }));
  },
};

export const newCommentTrigger = createTrigger({
  auth: frillAuth,
  name: 'new_comment',
  displayName: 'New Comment',
  description: 'Triggers when a new public comment or internal note is added in Frill.',
  props: {},
  sampleData: {
    idx: 'cmt_xyz789',
    message: 'Thanks for the suggestion, we are looking into it!',
    content_html: '<p>Thanks for the suggestion, we are looking into it!</p>',
    content_markdown: 'Thanks for the suggestion, we are looking into it!',
    is_private: false,
    type: 'comment',
    created_at: '2024-01-15T12:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
    follower_name: 'John Smith',
    follower_email: 'john@example.com',
    idea_id: 12345,
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
