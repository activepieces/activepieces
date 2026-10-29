import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfUtils } from '../common/utils';
import { listNotificationsOutputSchema } from '../output-schemas';

export const listNotifications = createAction({
  auth: huggingFaceAuth,
  name: 'list_notifications',
  classification: 'SEARCH',
  displayName: 'List Notifications',
  description: 'List the Hugging Face notifications of the connected account.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the connected account's Hub notifications (discussion and pull-request activity on repositories, paper discussions, posts and community blogs), one page per call with a next_page, optionally only unread ones or only those for one repository or where the user is mentioned. Each entry carries a 24-character discussion_id, which is what Delete Notifications needs (not the per-repository discussion number). Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: listNotificationsOutputSchema,
  props: {
    read_status: Property.StaticDropdown({
      displayName: 'Read Status',
      description: 'Return all notifications or only unread ones. Defaults to all.',
      required: false,
      defaultValue: 'all',
      options: {
        disabled: false,
        options: [
          { label: 'All', value: 'all' },
          { label: 'Unread only', value: 'unread' },
        ],
      },
    }),
    mention: Property.StaticDropdown({
      displayName: 'Involvement',
      description:
        'All notifications, only threads the user participates in, or only threads where the user is mentioned. Defaults to all.',
      required: false,
      defaultValue: 'all',
      options: {
        disabled: false,
        options: [
          { label: 'All', value: 'all' },
          { label: 'Participating', value: 'participating' },
          { label: 'Mentions', value: 'mentions' },
        ],
      },
    }),
    repo_type: Property.StaticDropdown({
      displayName: 'Repository Type',
      description: 'Only notifications about this kind of repository. Leave empty for every kind.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Model', value: 'model' },
          { label: 'Dataset', value: 'dataset' },
          { label: 'Space', value: 'space' },
        ],
      },
    }),
    repo_name: Property.ShortText({
      displayName: 'Repository ID',
      description: "Only notifications about this repository, in 'namespace/name' form, for example 'openai-community/gpt2'.",
      required: false,
    }),
    page: hfProps.page(),
  },
  async run(context) {
    const { read_status, mention, repo_type, repo_name, page } = context.propsValue;
    hfUtils.assertLimit({ value: page, min: 0, max: Number.MAX_SAFE_INTEGER, name: 'Page' });
    const currentPage = page ?? 0;
    const response = await hfHub.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/api/notifications',
      query: [
        ['p', currentPage],
        ['readStatus', read_status],
        ['mention', mention],
        ['repoType', repo_type],
        ['repoName', repo_name?.trim()],
      ],
    });
    const body = hfHub.isRecord(response.body) ? response.body : {};
    const rawNotifications = Array.isArray(body['notifications']) ? body['notifications'].filter(hfHub.isRecord) : [];
    const counts = hfHub.isRecord(body['count']) ? body['count'] : {};
    const start = typeof body['start'] === 'number' ? body['start'] : null;
    const matching = typeof counts['view'] === 'number' ? counts['view'] : null;
    const hasMore =
      rawNotifications.length > 0 && start !== null && matching !== null && start + rawNotifications.length < matching;
    return {
      notifications: rawNotifications.map(toNotification),
      count: rawNotifications.length,
      total_matching: matching,
      total_unread: typeof counts['unread'] === 'number' ? counts['unread'] : null,
      total_all: typeof counts['all'] === 'number' ? counts['all'] : null,
      next_page: hasMore ? currentPage + 1 : null,
    };
  },
});

function toNotification(raw: Record<string, unknown>): NotificationRow {
  const type = pickString({ source: raw, key: 'type' });
  const repo = pickRecord({ source: raw, key: 'repo' });
  const discussion = pickRecord({ source: raw, key: 'discussion' });
  const paper = pickRecord({ source: raw, key: 'paper' });
  const paperDiscussion = pickRecord({ source: raw, key: 'paperDiscussion' });
  const post = pickRecord({ source: raw, key: 'post' });
  const blog = pickRecord({ source: raw, key: 'blog' });
  const thread = discussion ?? paperDiscussion ?? post ?? blog;
  const participants = Array.isArray(thread?.['participating']) ? thread['participating'].filter(hfHub.isRecord) : [];
  return {
    type,
    read: raw['read'] === true,
    updated_at: pickString({ source: raw, key: 'updatedAt' }),
    discussion_id: pickString({ source: discussion, key: 'id' }) ?? pickString({ source: paperDiscussion, key: 'id' }),
    title:
      pickString({ source: discussion, key: 'title' }) ??
      pickString({ source: paper, key: 'title' }) ??
      pickString({ source: post, key: 'title' }) ??
      pickString({ source: blog, key: 'title' }),
    repo_id: pickString({ source: repo, key: 'name' }),
    repo_type: pickString({ source: repo, key: 'type' }),
    discussion_num: typeof discussion?.['num'] === 'number' ? discussion['num'] : null,
    discussion_status: pickString({ source: discussion, key: 'status' }),
    is_pull_request: typeof discussion?.['isPullRequest'] === 'boolean' ? discussion['isPullRequest'] : null,
    paper_id: pickString({ source: paper, key: '_id' }),
    post_id: pickString({ source: post, key: 'id' }) ?? pickString({ source: blog, key: 'id' }),
    post_slug: pickString({ source: post, key: 'slug' }) ?? pickString({ source: blog, key: 'slug' }),
    post_author: pickString({ source: post, key: 'authorName' }) ?? pickString({ source: blog, key: 'authorName' }),
    participants: participants
      .map((participant) => pickString({ source: participant, key: 'user' }))
      .filter((user): user is string => user !== null)
      .join(', '),
  };
}

function pickRecord({ source, key }: PickParams): Record<string, unknown> | null {
  const value = source?.[key];
  return hfHub.isRecord(value) ? value : null;
}

function pickString({ source, key }: PickParams): string | null {
  const value = source?.[key];
  return typeof value === 'string' ? value : null;
}

type PickParams = {
  source: Record<string, unknown> | null;
  key: string;
};

type NotificationRow = {
  type: string | null;
  read: boolean;
  updated_at: string | null;
  discussion_id: string | null;
  title: string | null;
  repo_id: string | null;
  repo_type: string | null;
  discussion_num: number | null;
  discussion_status: string | null;
  is_pull_request: boolean | null;
  paper_id: string | null;
  post_id: string | null;
  post_slug: string | null;
  post_author: string | null;
  participants: string;
};
