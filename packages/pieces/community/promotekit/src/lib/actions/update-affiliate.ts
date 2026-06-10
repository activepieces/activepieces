import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';

export const updateAffiliate = createAction({
  auth: promotekitAuth,
  name: 'update_affiliate',
  displayName: 'Update Affiliate',
  description: 'Update an existing affiliate in PromoteKit.',
  props: {
    affiliate_id: Property.ShortText({
      displayName: 'Affiliate ID',
      description: 'The ID of the affiliate to update.',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    payout_email: Property.ShortText({
      displayName: 'Payout Email',
      description: 'The email address where the affiliate receives payouts.',
      required: false,
    }),
    approved: Property.Checkbox({
      displayName: 'Approved',
      description: 'Whether the affiliate is approved.',
      required: false,
    }),
    banned: Property.Checkbox({
      displayName: 'Banned',
      description: 'Whether the affiliate is banned.',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {};
    if (context.propsValue.first_name !== undefined) body['first_name'] = context.propsValue.first_name;
    if (context.propsValue.last_name !== undefined) body['last_name'] = context.propsValue.last_name;
    if (context.propsValue.payout_email !== undefined) body['payout_email'] = context.propsValue.payout_email;
    if (context.propsValue.approved !== undefined) body['approved'] = context.propsValue.approved;
    if (context.propsValue.banned !== undefined) body['banned'] = context.propsValue.banned;

    const response = await promotekitApiCall<{
      data: Record<string, unknown>;
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: `/affiliates/${context.propsValue.affiliate_id}`,
      body,
    });
    return promotekitCommon.flattenAffiliate(response.body.data);
  },
});
