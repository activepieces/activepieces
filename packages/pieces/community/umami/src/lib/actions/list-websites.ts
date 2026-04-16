import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { umamiAuth, UmamiAuthValue } from '../auth';
import { umamiApiCall } from '../common';

export const listWebsites = createAction({
  auth: umamiAuth,
  name: 'list_websites',
  displayName: 'List Websites',
  description: 'Returns all websites tracked in your Umami account.',
  props: {
    limit: Property.Number({
      displayName: 'Max Results',
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
      auth: context.auth as UmamiAuthValue,
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
