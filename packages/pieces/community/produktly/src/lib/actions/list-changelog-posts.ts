import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { produktlyApiCall } from '../common/client';
import { produktlyAuth } from '../common/auth';
import { produktlyProps } from '../common/props';

export const listChangelogPosts = createAction({
  auth: produktlyAuth,
  name: 'list_changelog_posts',
  displayName: 'List Changelog Posts',
  description: 'List all posts within a specific changelog.',
  props: {
    changelog: produktlyProps.changelog,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of posts to return (1-100, default 50).',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of posts to skip for pagination (default 0).',
      required: false,
      defaultValue: 0,
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'Optional ISO 8601 date (e.g. 2024-01-01) to filter posts from.',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'Optional ISO 8601 date (e.g. 2024-12-31) to filter posts up to.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {
      limit: String(propsValue.limit ?? 50),
      offset: String(propsValue.offset ?? 0),
    };
    if (propsValue.start_date) queryParams['startDate'] = propsValue.start_date;
    if (propsValue.end_date) queryParams['endDate'] = propsValue.end_date;
    const response = await produktlyApiCall<{
      data: Array<{
        id: number;
        title: string;
        description: string;
        date: string;
        active: boolean;
        tags: Array<{ id: number; name: string; backgroundColor: string; textColor: string }>;
      }>;
    }>({
      auth,
      method: HttpMethod.GET,
      path: `/changelogs/${propsValue.changelog}/posts`,
      queryParams,
    });
    return response.body.data.map((post) => ({
      post_id: post.id,
      changelog_id: propsValue.changelog,
      post_title: post.title,
      post_description: post.description,
      post_date: post.date,
      post_active: post.active,
      post_tags: post.tags.map((t) => t.name).join(', '),
    }));
  },
});
