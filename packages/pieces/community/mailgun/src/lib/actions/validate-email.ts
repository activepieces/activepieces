import { createAction, Property } from '@activepieces/pieces-framework';
import { mailgunAuth } from '../..';
import { mailgunApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const validateEmail = createAction({
  auth: mailgunAuth,
  name: 'validate_email',
  displayName: 'Validate Email',
  description:
    'Validate an email address using Mailgun validation service. Requires a Mailgun account with email validation enabled.',
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address to validate.',
      required: true,
    }),
    providerLookup: Property.Checkbox({
      displayName: 'Provider Lookup',
      description:
        'Enable additional mailbox provider checks for more accurate results.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const auth = context.auth;

    const response = await mailgunApiCall<{
      address: string;
      is_disposable_address: boolean;
      is_role_address: boolean;
      reason: string[];
      result: string;
      risk: string;
    }>({
      apiKey: auth.props.api_key,
      region: auth.props.region,
      method: HttpMethod.GET,
      path: '/v4/address/validate',
      queryParams: {
        address: context.propsValue.email,
        provider_lookup: String(context.propsValue.providerLookup ?? true),
      },
    });

    return {
      address: response.body.address,
      is_disposable_address: response.body.is_disposable_address,
      is_role_address: response.body.is_role_address,
      reason: Array.isArray(response.body.reason)
        ? response.body.reason.join(', ')
        : null,
      result: response.body.result,
      risk: response.body.risk,
    };
  },
});
