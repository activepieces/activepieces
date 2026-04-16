import { createAction } from '@activepieces/pieces-framework'
import { Client } from '@microsoft/microsoft-graph-client'
import { microsoftSharePointAuth } from '../auth'
import { microsoftSharePointCommon } from '../common'
import { getGraphBaseUrl } from '../common/microsoft-cloud'

export const deleteListItemAction = createAction({
    auth: microsoftSharePointAuth,
    name: 'microsoft_sharepoint_delete_list_item',
    displayName: 'Delete List Item',
    description: 'Deletes an existing item from a list.',
    props: {
        siteId: microsoftSharePointCommon.siteId,
        listId: microsoftSharePointCommon.listId,
        listItemId: microsoftSharePointCommon.listItemId,
    },
    async run(context) {
        const { siteId, listId, listItemId } = context.propsValue

        const cloud = context.auth.props?.['cloud'] as string | undefined
        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(context.auth.access_token),
            },
            baseUrl: getGraphBaseUrl(cloud),
        })

        return await client.api(`/sites/${siteId}/lists/${listId}/items/${listItemId}`).delete()
    },
})
