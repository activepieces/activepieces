import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';

export const listReferrals = createAction({
  auth: promotekitAuth,
  name: 'list_referrals',
  displayName: 'List Referrals',
  description: 'List all referrals in your PromoteKit account.',
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number to retrieve. Defaults to 1.',
      required: false,
      defaultValue: 1,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of referrals per page (max 100). Defaults to 10.',
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
      path: '/referrals',
      queryParams: {
        page: String(context.propsValue.page ?? 1),
        limit: String(context.propsValue.limit ?? 10),
      },
    });
    return response.body.data.map(promotekitCommon.flattenReferral);
  },
});
