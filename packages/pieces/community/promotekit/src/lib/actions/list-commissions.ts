import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';

export const listCommissions = createAction({
  auth: promotekitAuth,
  name: 'list_commissions',
  displayName: 'List Commissions',
  description: 'List all commissions in your PromoteKit account.',
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number to retrieve. Defaults to 1.',
      required: false,
      defaultValue: 1,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of commissions per page (max 100). Defaults to 10.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const response = await promotekitApiCall<{
      data: Record<string, unknown>[];
    }>({
      token: context.auth as unknown as string,
      method: HttpMethod.GET,
      path: '/commissions',
      queryParams: {
        page: String(context.propsValue.page ?? 1),
        limit: String(context.propsValue.limit ?? 10),
      },
    });
    return response.body.data.map(promotekitCommon.flattenCommission);
  },
});
