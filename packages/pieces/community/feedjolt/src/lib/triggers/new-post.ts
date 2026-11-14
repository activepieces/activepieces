import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import { feedjoltAuth } from '../auth';
import { feedjoltCommon } from '../common';

const props = {
  workspaceSlug: feedjoltCommon.workspaceDropdown,
  boardId: feedjoltCommon.boardIdDropdown,
};

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof feedjoltAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const isTest = lastFetchEpochMS === 0;
    const collected: PollingItem[] = [];
    let page = 1;

    while (page <= MAX_PAGES) {
      const response = await feedjoltCommon.apiCall({
        token: auth.secret_text,
        method: HttpMethod.GET,
        path: `/workspaces/${encodeURIComponent(propsValue.workspaceSlug)}/posts`,
        queryParams: {
          page,
          page_size: PAGE_SIZE,
          sort_by: 'newest',
          board_id: propsValue.boardId,
        },
      });
      const posts = feedjoltCommon.parseList(response.body, ['posts', 'data', 'items', 'results']);
      const items = mapPostsToPollingItems(posts);
      collected.push(...items);

      if (isTest || items.length === 0) {
        break;
      }

      const oldestOnPage = Math.min(...items.map((item) => item.epochMilliSeconds));
      if (oldestOnPage <= lastFetchEpochMS) {
        break;
      }

      const total = postsListTotal(response.body);
      if (total !== null && page * PAGE_SIZE >= total) {
        break;
      }
      if (posts.length < PAGE_SIZE) {
        break;
      }
      page += 1;
    }

    return collected;
  },
};

export const newPostTrigger = createTrigger({
  auth: feedjoltAuth,
  name: 'new_post',
  classification: 'READ',
  displayName: 'New Post',
  description: 'Triggers when a new feedback post is created in a workspace or board.',
  aiMetadata: {
    description:
      'Fires once per newly created Feedjolt post in the selected workspace, optionally limited to one board. Polled; payload is one flattened post.',
  },
  props,
  sampleData: {
    id: '11111111-1111-1111-1111-111111111111',
    workspace_id: '22222222-2222-2222-2222-222222222222',
    board_id: '33333333-3333-3333-3333-333333333333',
    title: 'Add dark mode',
    body: 'Please add a dark theme to the dashboard.',
    status_id: '44444444-4444-4444-4444-444444444444',
    author_type: 'end_user',
    author_id: '55555555-5555-5555-5555-555555555555',
    author_name: 'Jane Doe',
    author_email: 'jane@example.com',
    owner_admin_id: null,
    owner_name: null,
    owner_email: null,
    is_draft: false,
    is_internal: false,
    vote_count: 3,
    weighted_score: 3,
    comment_count: 0,
    is_spam: false,
    is_incognito: false,
    merged_into_id: null,
    tags: 'feature, ui',
    version_id: null,
    version_name: null,
    sentiment: null,
    has_linear_issue: false,
    created_at: '2026-04-17T10:30:00Z',
    updated_at: '2026-04-17T10:30:00Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
});

function mapPostsToPollingItems(posts: Record<string, unknown>[]): PollingItem[] {
  return posts.flatMap((post) => {
    const flattened = feedjoltCommon.flattenPost(post);
    const createdAt = flattened['created_at'];
    if (typeof createdAt !== 'string') {
      return [];
    }
    const epochMilliSeconds = new Date(createdAt).getTime();
    if (Number.isNaN(epochMilliSeconds)) {
      return [];
    }
    return [{ epochMilliSeconds, data: flattened }];
  });
}

function postsListTotal(body: unknown): number | null {
  if (!feedjoltCommon.isRecord(body)) {
    return null;
  }
  const total = body['total'];
  return typeof total === 'number' ? total : null;
}

type PollingItem = {
  epochMilliSeconds: number;
  data: Record<string, unknown>;
};
