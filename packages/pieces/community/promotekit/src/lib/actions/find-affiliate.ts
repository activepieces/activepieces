import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';

export const findAffiliate = createAction({
  auth: promotekitAuth,
  name: 'find_affiliate',
  displayName: 'Find Affiliate',
  description: 'Get details of a specific affiliate by ID.',
  audience: 'both',
  aiMetadata: {
    description: 'Fetch a single affiliate by its PromoteKit affiliate ID. Use when you already have the exact ID and need that affiliate\'s details; to discover IDs, list affiliates first. Read-only and safe to repeat.',
    idempotent: true,
  },
  props: {
    affiliate_id: Property.ShortText({
      displayName: 'Affiliate ID',
      description: 'The ID of the affiliate to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const response = await promotekitApiCall<{
      data: Record<string, unknown>;
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/affiliates/${context.propsValue.affiliate_id}`,
    });
    return promotekitCommon.flattenAffiliate(response.body.data);
  },
});
