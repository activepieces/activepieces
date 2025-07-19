import { httpClient, HttpMethod } from '@ensemble/pieces-common';
import { createAction } from '@ensemble/pieces-framework';
import { fliqrConfig } from '../common/models';
import { fliqrAuth } from '../../index';

export const getFliqrAccountFlows = createAction({
  // auth: check https://www.ensemble.com/docs/developers/piece-reference/authentication,
  name: 'get_fliqr_account_flows',
  auth: fliqrAuth,
  displayName: 'Get Account Flows',
  description: 'Get all flows from the account',
  props: {},
  async run(context) {
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      url: `${fliqrConfig.baseUrl}/accounts/flows`,
      headers: {
        [fliqrConfig.accessTokenHeaderKey]: context.auth,
      }
    });
    return res.body;
  },
});
