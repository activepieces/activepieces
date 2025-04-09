import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { kizeoFormsAuth } from '../..'
import { endpoint, kizeoFormsCommon } from '../common'

export const getListDefinition = createAction({
  auth: kizeoFormsAuth,

  name: 'get_list_definition',
  displayName: 'Get List Definition',
  description: 'Get the definition of a list',
  props: {
    listId: kizeoFormsCommon.listId,
  },
  async run(context) {
    const { listId } = context.propsValue
    const response = await httpClient.sendRequest<{ list: unknown }>({
      method: HttpMethod.GET,
      url: endpoint + `public/v4/lists/${listId}/definition?used-with-activepieces=`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: context.auth,
      },
    })
    if (response.status === 200) {
      return response.body
    }

    return []
  },
})
