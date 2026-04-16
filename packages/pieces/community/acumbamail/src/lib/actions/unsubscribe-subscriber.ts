import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { acumbamailAuth } from '../auth'
import { acumbamailCommon } from '../common'

export const unsubscribeAction = createAction({
    auth: acumbamailAuth,
    name: 'acumbamail_unsubscribe_subscriber',
    displayName: 'Unsuscribe Subscriber',
    description: 'Unsubscribes an email address from a subscriber list of your choosing.',
    props: {
        email: Property.ShortText({
            displayName: 'Email',
            required: true,
        }),
        listId: acumbamailCommon.listId,
    },
    async run(context) {
        const { listId, email } = context.propsValue
        const request: HttpRequest = {
            method: HttpMethod.DELETE,
            url: acumbamailCommon.baseUrl + '/unsubscribeSubscriber/',
            queryParams: {
                auth_token: context.auth.secret_text,
                list_id: listId.toString(),
                email: email,
            },
        }

        const res = await httpClient.sendRequest(request)
        return res.body
    },
})
