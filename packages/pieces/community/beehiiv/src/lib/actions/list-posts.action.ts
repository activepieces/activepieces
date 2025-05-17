import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, HttpRequest, QueryParams, httpClient } from "@activepieces/pieces-common";
import { BEEHIIV_API_URL } from "../common/constants";
import { beehiivAuth } from "../../index";

export const listPostsAction = createAction({
  auth: beehiivAuth,
  name: 'list_posts',
  displayName: 'List Posts',
  description: 'Retrieve all posts belonging to a specific publication.',
  props: {
    publicationId: Property.ShortText({
      displayName: 'Publication ID',
      description: 'The ID of the publication.',
      required: true,
    }),
    expand: Property.StaticMultiSelectDropdown({
      displayName: 'Expand Results',
      description: 'Optionally expand the results by adding additional information.',
      required: false,
      options: {
        options: [
          { label: 'Stats', value: 'stats' },
          { label: 'Free Web Content', value: 'free_web_content' },
          { label: 'Free Email Content', value: 'free_email_content' },
          { label: 'Free RSS Content', value: 'free_rss_content' },
          { label: 'Premium Web Content', value: 'premium_web_content' },
          { label: 'Premium Email Content', value: 'premium_email_content' },
        ]
      }
    }),
    audience: Property.StaticDropdown({
      displayName: 'Audience',
      description: 'Optionally filter the results by audience.',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Free', value: 'free' },
          { label: 'Premium', value: 'premium' },
        ]
      }
    }),
    platform: Property.StaticDropdown({
      displayName: 'Platform',
      description: 'Optionally filter the results by platform.',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Web', value: 'web' },
          { label: 'Email', value: 'email' },
          { label: 'Both', value: 'both' },
        ]
      }
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Optionally filter the results by the status of the post.',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Draft', value: 'draft' },
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Archived', value: 'archived' },
        ]
      }
    }),
    content_tags: Property.Array({
      displayName: 'Content Tags',
      description: 'Filter posts by content tags. Returns posts with ANY of the specified tags.',
      required: false,
      properties: {
        tag: Property.ShortText({
          displayName: 'Tag',
          description: 'A single content tag.',
          required: true
        })
      }
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of posts to return (1-100, default 10).',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (default 1).',
      required: false,
    }),
    order_by: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'Field to sort results by.',
      required: false,
      options: {
        options: [
          { label: 'Created Date', value: 'created' },
          { label: 'Publish Date', value: 'publish_date' },
          { label: 'Displayed Date', value: 'displayed_date' },
        ]
      }
    }),
    direction: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: 'Direction to sort results.',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ]
      }
    }),
    hidden_from_feed: Property.StaticDropdown({
        displayName: 'Hidden From Feed',
        description: 'Filter by the hidden_from_feed attribute.',
        required: false,
        options:{
            options: [
                {label: 'All', value: 'all'},
                {label: 'True', value: 'true'},
                {label: 'False', value: 'false'},
            ]
        }
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const publicationId = propsValue['publicationId'];

    const queryParams: Record<string, string | string[] | undefined> = {};
    if (propsValue['expand'] && (propsValue['expand'] as string[]).length > 0) {
      queryParams['expand'] = (propsValue['expand'] as string[]).join(',');
    }
    if (propsValue['audience'] && propsValue['audience'] !== 'all') {
      queryParams['audience'] = propsValue['audience'] as string;
    }
    if (propsValue['platform'] && propsValue['platform'] !== 'all') {
      queryParams['platform'] = propsValue['platform'] as string;
    }
    if (propsValue['status'] && propsValue['status'] !== 'all') {
      queryParams['status'] = propsValue['status'] as string;
    }

    const contentTagsProp = propsValue['content_tags'] as Array<{ tag: string }> | undefined;
    if (contentTagsProp && contentTagsProp.length > 0) {
      const tags = contentTagsProp.map(ct => ct.tag).filter(tag => tag && tag.trim() !== '');
      if (tags.length > 0) {
        queryParams['content_tags[]'] = tags;
      }
    }

    if (propsValue['limit'] !== undefined) {
      queryParams['limit'] = (propsValue['limit'] as number).toString();
    }
    if (propsValue['page'] !== undefined) {
      queryParams['page'] = (propsValue['page'] as number).toString();
    }
    if (propsValue['order_by']) {
      queryParams['order_by'] = propsValue['order_by'] as string;
    }
    if (propsValue['direction']) {
      queryParams['direction'] = propsValue['direction'] as string;
    }
    if (propsValue['hidden_from_feed'] && propsValue['hidden_from_feed'] !== 'all') {
        queryParams['hidden_from_feed'] = propsValue['hidden_from_feed'] as string;
    }

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${BEEHIIV_API_URL}/publications/${publicationId}/posts`,
      headers: {
        'Authorization': `Bearer ${auth}`,
      },
      queryParams: queryParams as QueryParams,
    };

    return await httpClient.sendRequest(request);
  },
});
