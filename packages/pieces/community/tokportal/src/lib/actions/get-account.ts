import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tokportalAuth } from '../auth';
import { tokportalApiCall } from '../common/client';
import { tokportalProps } from '../common/props';

export const getAccount = createAction({
  auth: tokportalAuth,
  name: 'get_account',
  displayName: 'Get Account',
  description: 'Retrieves a delivered (saved) account: username, platform, country, profile URL and ban state.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch one delivered TokPortal account by ID. Use List Accounts to find IDs or the saved_account_id from an account.finalized event. Safe to retry.',
    idempotent: true,
  },
  props: {
    accountId: tokportalProps.accountId(true),
  },
  async run(context) {
    const response = await tokportalApiCall<{ data: Record<string, unknown> }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: `/accounts/${context.propsValue.accountId}`,
    });
    return response.data ?? response;
  },
});
