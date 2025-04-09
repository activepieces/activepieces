import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import qs from 'qs'
import { LEVER_BASE_URL, leverAuth } from '../..'

export const getOpportunity = createAction({
  name: 'getOpportunity',
  displayName: 'Get opportunity',
  description:
    "Retrieve a single opportunity, i.e. an individual's unique candidacy or journey for a given job position",
  auth: leverAuth,
  props: {
    opportunityId: Property.ShortText({
      displayName: 'Opportunity ID',
      required: true,
    }),
    expand: Property.Array({
      displayName: 'Expand',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${LEVER_BASE_URL}/opportunities/${propsValue.opportunityId}?${decodeURIComponent(
        qs.stringify({ expand: propsValue.expand }, { arrayFormat: 'repeat' }),
      )}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.apiKey,
        password: '',
      },
    })
    return response.body.data
  },
})
