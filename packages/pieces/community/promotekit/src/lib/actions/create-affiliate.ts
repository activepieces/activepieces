import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';

export const createAffiliate = createAction({
  auth: promotekitAuth,
  name: 'create_affiliate',
  displayName: 'Create Affiliate',
  description: 'Create a new affiliate in PromoteKit.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the new affiliate.',
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
    campaign_id: promotekitCommon.campaignDropdown,
  },
  async run(context) {
    const body: Record<string, unknown> = {
      email: context.propsValue.email,
    };
    if (context.propsValue.first_name) body['first_name'] = context.propsValue.first_name;
    if (context.propsValue.last_name) body['last_name'] = context.propsValue.last_name;
    if (context.propsValue.campaign_id) body['campaign_id'] = context.propsValue.campaign_id;

    const response = await promotekitApiCall<{
      data: Record<string, unknown>;
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/affiliates',
      body,
    });
    return promotekitCommon.flattenAffiliate(response.body.data);
  },
});
