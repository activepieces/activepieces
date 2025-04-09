import { AuthenticationType, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { zuoraAuth } from '../../'
import { getAccessToken } from '../common'

export const findAccountAction = createAction({
  auth: zuoraAuth,
  name: 'find-account',
  displayName: 'Find Customer Account',
  description: 'Retrieves account based on name.',
  props: {
    name: Property.ShortText({
      displayName: 'Account Name',
      required: true,
    }),
  },
  async run(context) {
    const name = context.propsValue.name
    const token = await getAccessToken(context.auth)

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${context.auth.environment}/object-query/accounts`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      queryParams: {
        'filter[]': `name.EQ:${name}`,
      },
    }

    const response = await httpClient.sendRequest(request)
    return response.body
  },
})
