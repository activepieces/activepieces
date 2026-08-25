import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fliqrAuth } from '../auth';
import { fliqrConfig } from '../common/models';


export const getFliqrAccountDetails = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'get_fliqr_account_details',
  auth: fliqrAuth,
  displayName: 'Get Business Account details',
  description: 'Get basic account details of business',
  audience: 'both',
  aiMetadata: { description: 'Fetches the basic profile/details of the authenticated Fliqr AI business account (the account that owns the connected API token). Use to retrieve account identity or configuration before acting on the account. Read-only; repeating the call is safe.', idempotent: true },
  props: {},
  async run(context) {
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      url: `${fliqrConfig.baseUrl}/accounts/me`,
      headers: {
        [fliqrConfig.accessTokenHeaderKey]: context.auth.secret_text,
        },
    });
    return res.body;
  },
});