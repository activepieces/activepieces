import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { umamiAuth } from '../..';
import { umamiApiCall } from '../common';

export const listWebsites = createAction({
  auth: umamiAuth,
  name: 'list_websites',
  displayName: 'List Websites',
  description: 'List all websites tracked in your Umami account.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of websites to return.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { limit } = context.propsValue;

    const response = await umamiApiCall<{
      data: {
        id: string;
        name: string;
        domain: string;
        shareId: string | null;
        createdAt: string;
      }[];
      count: number;
    }>({
      serverUrl: context.auth.props.base_url,
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/websites',
      queryParams: {
        pageSize: String(limit ?? 100),
      },
    });

    return response.body.data.map((w) => ({
      id: w.id,
      name: w.name,
      domain: w.domain,
      share_id: w.shareId ?? null,
      created_at: w.createdAt,
    }));
  },
});
