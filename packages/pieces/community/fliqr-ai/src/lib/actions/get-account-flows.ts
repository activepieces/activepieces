import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { fliqrAuth } from '../../index'
import { fliqrConfig } from '../common/models'

export const getFliqrAccountFlows = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
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
      },
    })
    return res.body
  },
})
