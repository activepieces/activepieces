import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BEEHIIV_API_URL, beehiivAuth, publicationIdProperty } from '../common';

export const listAllPosts = createAction({
  name: 'list_all_posts',
  displayName: 'List All Posts',
  description: 'Fetch recent posts to reference or repurpose across tools',
  auth: beehiivAuth,
  props: {
    publication_id: publicationIdProperty,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'The maximum number of posts to return (1-100)',
      required: false,
      defaultValue: 10,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'The page number to return',
      required: false,
      defaultValue: 1,
    }),
    audience: Property.StaticDropdown({
      displayName: 'Audience',
      description: 'Filter posts by audience',
      required: false,
      options: {
        options: [
          { label: 'Free', value: 'free' },
          { label: 'Premium', value: 'premium' },
          { label: 'All', value: 'all' },
        ],
      },
      defaultValue: 'all',
    }),
    platform: Property.StaticDropdown({
      displayName: 'Platform',
      description: 'Filter posts by platform',
      required: false,
      options: {
        options: [
          { label: 'Web', value: 'web' },
          { label: 'Email', value: 'email' },
          { label: 'Both', value: 'both' },
          { label: 'All', value: 'all' },
        ],
      },
      defaultValue: 'all',
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter posts by status',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Archived', value: 'archived' },
          { label: 'All', value: 'all' },
        ],
      },
      defaultValue: 'all',
    }),
    content_tags: Property.Array({
      displayName: 'Content Tags',
      description: 'Filter posts by content tags',
      required: false,
    }),
    order_by: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'The field to sort the results by',
      required: false,
      options: {
        options: [
          { label: 'Created', value: 'created' },
          { label: 'Publish Date', value: 'publish_date' },
          { label: 'Displayed Date', value: 'displayed_date' },
        ],
      },
      defaultValue: 'created',
    }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description: 'The direction to sort the results',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
      defaultValue: 'asc',
    }),
    expand: Property.MultiSelectDropdown({
      displayName: 'Expand',
      description: 'Additional information to include in the response',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Stats', value: 'stats' },
            { label: 'Free Web Content', value: 'free_web_content' },
            { label: 'Free Email Content', value: 'free_email_content' },
            { label: 'Free RSS Content', value: 'free_rss_content' },
            { label: 'Premium Web Content', value: 'premium_web_content' },
            { label: 'Premium Email Content', value: 'premium_email_content' },
          ],
        };
      },
    }),
  },
  async run({ auth, propsValue }) {
    const {
      publication_id,
      limit,
      page,
      audience,
      platform,
      status,
      content_tags,
      order_by,
      direction,
      expand,
    } = propsValue;

    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    if (page) queryParams.append('page', page.toString());
    if (audience) queryParams.append('audience', audience);
    if (platform) queryParams.append('platform', platform);
    if (status) queryParams.append('status', status);
    if (content_tags && content_tags.length > 0) {
      content_tags.forEach((tag: string) => {
        queryParams.append('content_tags[]', tag);
      });
    }
    if (order_by) queryParams.append('order_by', order_by);
    if (direction) queryParams.append('direction', direction);
    if (expand && expand.length > 0) {
      expand.forEach((item: string) => {
        queryParams.append('expand[]', item);
      });
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${BEEHIIV_API_URL}/publications/${publication_id}/posts${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });

    return response.body;
  },
});
