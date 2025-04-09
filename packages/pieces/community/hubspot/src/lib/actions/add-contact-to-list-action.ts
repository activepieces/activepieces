import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { hubspotAuth } from '../../'
import { staticListsDropdown } from '../common/props'

export const hubSpotListsAddContactAction = createAction({
  auth: hubspotAuth,
  name: 'add_contact_to_list',
  displayName: 'Add contact To List',
  description: 'Add contact to list',
  props: {
    listId: staticListsDropdown,
    email: Property.ShortText({
      displayName: 'Contact Email',
      required: true,
    }),
  },

  async run(context) {
    const { listId, email } = context.propsValue

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.hubapi.com/contacts/v1/lists/${listId}/add`,
      body: {
        emails: [email],
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    })

    return response.body
  },
})
