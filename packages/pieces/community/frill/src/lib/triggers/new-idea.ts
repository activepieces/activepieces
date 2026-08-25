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
        name: string;
        slug: string;
        excerpt: string;
        content_html: string;
        content_markdown: string;
        vote_count: number;
        comment_count: number;
        is_pined: boolean;
        is_bug: boolean;
        is_archived: boolean;
        is_completed: boolean;
        show_in_roadmap: boolean;
        approval_status: string;
        created_at: string;
        updated_at: string;
        author: { name: string; email: string };
        status: { name: string; color: string };
        topics: { name: string }[];
      }[];
    }>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: '/ideas',
      queryParams: { limit: 100 },
    });

    return response.body.data.map((item) => ({
      epochMilliSeconds: new Date(item.created_at).getTime(),
      data: {
        idx: item.idx,
        name: item.name,
        slug: item.slug,
        excerpt: item.excerpt ?? null,
        content_html: item.content_html ?? null,
        content_markdown: item.content_markdown ?? null,
        vote_count: item.vote_count ?? 0,
        comment_count: item.comment_count ?? 0,
        is_pined: item.is_pined ?? false,
        is_bug: item.is_bug ?? false,
        is_archived: item.is_archived ?? false,
        is_completed: item.is_completed ?? false,
        show_in_roadmap: item.show_in_roadmap ?? false,
        approval_status: item.approval_status ?? null,
        created_at: item.created_at,
        updated_at: item.updated_at ?? null,
        author_name: item.author?.name ?? null,
        author_email: item.author?.email ?? null,
        status_name: item.status?.name ?? null,
        status_color: item.status?.color ?? null,
        topics: Array.isArray(item.topics) ? item.topics.map((t) => t.name).join(', ') : null,
      },
    }));
  },
};

export const newIdeaTrigger = createTrigger({
  auth: frillAuth,
  name: 'new_idea',
  displayName: 'New Idea',
  description: 'Triggers when a new idea or feedback entry is created in Frill.',
  aiMetadata: {
    description: 'Fires when a new idea or feedback entry is created in Frill (polled). Represents fresh user-submitted feedback or feature requests entering the board.',
  },
  props: {},
  sampleData: {
    idx: 'idea_abc123',
    name: 'Dark Mode Support',
    slug: 'dark-mode-support',
    excerpt: 'Please add a dark mode to the dashboard.',
    content_html: '<p>Please add a dark mode to the dashboard.</p>',
    content_markdown: 'Please add a dark mode to the dashboard.',
    vote_count: 42,
    comment_count: 5,
    is_pined: false,
    is_bug: false,
    is_archived: false,
    is_completed: false,
    show_in_roadmap: true,
    approval_status: 'approved',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    author_name: 'Jane Doe',
    author_email: 'jane@example.com',
    status_name: 'Planned',
    status_color: '#3b82f6',
    topics: 'UI, Feature Request',
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
