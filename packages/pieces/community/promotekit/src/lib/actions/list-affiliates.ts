import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';

export const listAffiliates = createAction({
  auth: promotekitAuth,
  name: 'list_affiliates',
  displayName: 'List Affiliates',
  description: 'List all affiliates in your PromoteKit account.',
  audience: 'both',
  aiMetadata: {
    description: 'Retrieve a paginated list of affiliates in the PromoteKit account. Use to enumerate or browse affiliates rather than look one up by a known ID. Supports page and per-page limit (max 100); read-only and safe to repeat.',
    idempotent: true,
  },
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number to retrieve. Defaults to 1.',
      required: false,
      defaultValue: 1,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of affiliates per page (max 100). Defaults to 10.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const response = await promotekitApiCall<{
      data: Record<string, unknown>[];
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/affiliates',
      queryParams: {
        page: String(context.propsValue.page ?? 1),
        limit: String(context.propsValue.limit ?? 10),
      },
    });
    return response.body.data.map(promotekitCommon.flattenAffiliate);
  },
});
