import { Property, createAction } from '@activepieces/pieces-framework'
import { Client } from '@microsoft/microsoft-graph-client'
import { microsoftSharePointAuth } from '../../'
import { microsoftSharePointCommon } from '../common'

export const findListItemAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_search_list_item',
  displayName: 'Find List Item',
  description: 'Finds a item in a list based on name.',
  props: {
    siteId: microsoftSharePointCommon.siteId,
    listId: microsoftSharePointCommon.listId,
    searchValue: Property.ShortText({
      displayName: 'Title',
      description: 'Item title to search',
      required: true,
    }),
  },
  async run(context) {
    const { siteId, listId, searchValue } = context.propsValue

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    })

    // Escaping single quotes
    const title = searchValue.replaceAll("'", "''")
    return await client
      .api(`/sites/${siteId}/lists/${listId}/items?$expand=fields&filter=fields/Title eq '${title}'`)
      .headers({ Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly' })
      .get()
  },
})
