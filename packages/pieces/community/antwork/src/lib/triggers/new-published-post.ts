import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import { antworkAuth } from '../auth';
import { antworkApiCall, antworkCommon } from '../common';

type Post = {
  id: string;
  workspaceId: string;
  accountId: string;
  platform: string;
  status: string;
  text: string;
  publishedAt: string | null;
  publishedUrl: string | null;
  createdAt: string;
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof antworkAuth>,
  { workspace?: string; account?: string }
> = {
  // GET /posts orders by createdAt and has no publishedAfter filter, so read
  // the newest 100 published posts and let the helper keep those newer than
  // the last poll by publish time.
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const response = await antworkApiCall<{ posts: Post[] }>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/posts',
      queryParams: { status: 'published', limit: '100' },
    });
    return (response.body.posts ?? [])
      .filter((p) => p.status === 'published')
      .filter((p) => !propsValue.workspace || p.workspaceId === propsValue.workspace)
      .filter((p) => !propsValue.account || p.accountId === propsValue.account)
      .map((p) => ({
        epochMilliSeconds: new Date(p.publishedAt ?? p.createdAt).getTime(),
        data: p,
      }));
  },
};

export const newPublishedPost = createTrigger({
  auth: antworkAuth,
  name: 'new_published_post',
  classification: 'READ',
  displayName: 'New Published Post',
  description: 'Triggers when a post goes live on a social account through Antwork.',
  aiMetadata: {
    description:
      'Fires when an Antwork post is published to a social account, emitting the post with its id, text, platform, account, publish time and public URL. Optionally limited to one workspace or account. Use to react to content going live, for example to log it, notify a channel or draft a follow-up.',
  },
  props: {
    workspace: antworkCommon.workspace(false),
    account: antworkCommon.account(false),
  },
  sampleData: {
    object: 'post',
    id: 'post_123',
    workspaceId: 'ws_123',
    accountId: 'acc_123',
    platform: 'linkedin',
    campaignId: null,
    status: 'published',
    text: 'We just shipped scheduled exports.',
    mediaUrls: [],
    scheduledFor: null,
    publishedAt: '2026-11-02T09:05:00.000Z',
    publishedUrl: 'https://www.linkedin.com/feed/update/urn:li:share:123',
    platformPostId: 'urn:li:share:123',
    error: null,
    createdAt: '2026-11-02T09:00:00.000Z',
    updatedAt: '2026-11-02T09:05:00.000Z',
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
