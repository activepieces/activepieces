import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { adaptlyPostAuth } from '../auth';
import { adaptlyPostClient } from '../common/client';
import { adaptlyPostOutput } from '../common/output';
import { adaptlyPostProps } from '../common/props';
import { AdaptlyPostPost } from '../common/types';

const PAGE_SIZE = 100;
const MAX_RESULTS = 500;

export const findPostsAction = createAction({
  auth: adaptlyPostAuth,
  name: 'find_posts',
  classification: 'SEARCH',
  displayName: 'Find Posts',
  description: 'Finds posts by status, platform, label and date.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search AdaptlyPost posts, newest first by default, filtered by status, platform, label and a date window on the scheduled or created date. Returns up to Limit posts as flat rows. Use Get Post when you already have the post ID. Safe to retry.',
    idempotent: true,
  },
  props: {
    statuses: Property.StaticMultiSelectDropdown({
      displayName: 'Statuses',
      description:
        'Only posts with one of these statuses. Leave empty for all.',
      required: false,
      options: { disabled: false, options: adaptlyPostProps.statusOptions },
    }),
    platforms: adaptlyPostProps.platforms({
      displayName: 'Platforms',
      description:
        'Only posts that go to one of these platforms. Leave empty for all.',
    }),
    labels: adaptlyPostProps.labels({
      description: 'Only posts that carry one of these labels.',
    }),
    start_date: Property.DateTime({
      displayName: 'From',
      description:
        'Only posts on or after this date, for example 2026-11-01T00:00:00Z.',
      required: false,
    }),
    end_date: Property.DateTime({
      displayName: 'To',
      description:
        'Only posts on or before this date, for example 2026-11-30T23:59:59Z.',
      required: false,
    }),
    sort_order: Property.StaticDropdown({
      displayName: 'Order',
      required: false,
      defaultValue: 'NEWEST',
      options: {
        disabled: false,
        options: [
          { label: 'Newest first', value: 'NEWEST' },
          { label: 'Oldest first', value: 'OLDEST' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: `How many posts to return, from 1 to ${MAX_RESULTS}.`,
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { statuses, platforms, labels, start_date, end_date, sort_order } =
      context.propsValue;
    const limit = Math.min(
      Math.max(Math.floor(context.propsValue.limit ?? 10), 1),
      MAX_RESULTS
    );
    const posts: AdaptlyPostPost[] = [];
    let hasMore = true;
    while (hasMore && posts.length < limit) {
      const page = await adaptlyPostClient.request<{
        posts: AdaptlyPostPost[];
        hasMore: boolean;
      }>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.GET,
        path: '/social-posts',
        query: {
          limit: Math.min(PAGE_SIZE, limit - posts.length),
          offset: posts.length,
          sortOrder: sort_order ?? 'NEWEST',
          statuses: statuses as string[] | undefined,
          platforms: platforms as string[] | undefined,
          labelIds: labels as string[] | undefined,
          startDate: start_date,
          endDate: end_date,
        },
      });
      posts.push(...page.posts);
      hasMore = page.hasMore && page.posts.length > 0;
    }
    return posts.slice(0, limit).map(adaptlyPostOutput.post);
  },
});
