import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedhiveAuth } from '../common/auth';
import { feedhiveCommon } from '../common';

export const listPostsAction = createAction({
  auth: feedhiveAuth,
  name: 'list_posts',
  displayName: 'List Posts',
  description: 'Returns a list of posts, optionally filtered by status or labels.',
  audience: 'both',
  aiMetadata: { description: 'Lists FeedHive posts, optionally narrowed by status (draft, scheduled, publishing, published, failed) and/or labels; leaving both filters empty returns all posts up to the result limit (max 100). Use to discover post IDs or survey the content queue. Read-only and idempotent.', idempotent: true },
  props: {
    status: Property.StaticDropdown({
      displayName: 'Filter by Status',
      description: 'Only return posts with this status. Leave empty to return all posts.',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'Publishing', value: 'publishing' },
          { label: 'Published', value: 'published' },
          { label: 'Failed', value: 'failed' },
        ],
      },
    }),
    labels: feedhiveCommon.labelsMultiDropdown,
    limit: Property.Number({
      displayName: 'Maximum Results',
      description: 'Maximum number of posts to return. Between 1 and 100.',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { status, labels, limit } = context.propsValue;

    const queryParams: Record<string, string> = {
      limit: String(Math.min(limit ?? 20, 100)),
    };
    if (status) queryParams['status'] = status;
    if (labels && labels.length > 0) queryParams['labels'] = labels.join(',');

    const response = await feedhiveCommon.apiCall<{
      data: { items: Record<string, unknown>[]; total: number; has_more: boolean };
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/posts',
      queryParams,
    });

    return (response.body.data?.items ?? []).map((p) => feedhiveCommon.flattenPost(p));
  },
});
