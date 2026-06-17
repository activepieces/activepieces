import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { neverbounceAuth } from '../common/auth';

export const verifyEmailAddress = createAction({
  auth: neverbounceAuth,
  name: 'verifyEmailAddress',
  displayName: 'Verify Email Address',
  description: 'Verify a single email address using NeverBounce API',
  audience: 'both',
  aiMetadata: { description: 'Checks the deliverability of a single email address via NeverBounce, returning a verification result (e.g. valid, invalid, disposable, catch-all) so an agent can decide whether to keep, flag, or discard the address before sending. Use for one-off real-time validation of a single recipient; for large lists use a bulk/list-verification flow instead. Requires the email address as input. Read-only and idempotent: re-running with the same address does not change anything.', idempotent: true },
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address to verify',
      required: true,
    }),
  },
  async run(context) {
    const queryParams: any = {
      key: context.auth.secret_text,
      email: context.propsValue.email,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.neverbounce.com/v4.2/single/check',
      queryParams,
    });

    return response.body;
  },
});