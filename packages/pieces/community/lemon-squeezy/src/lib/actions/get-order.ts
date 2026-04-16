import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { fetchOrderOptions, getLemonSqueezyHeaders, LEMON_SQUEEZY_API_BASE } from '../common/api'
import { lemonSqueezyAuth } from '../common/auth'

export const getOrder = createAction({
    name: 'get_order',
    displayName: 'Get Order',
    description: 'Retrieve the details of a specific order by its ID.',
    auth: lemonSqueezyAuth,
    props: {
        orderId: Property.Dropdown({
            displayName: 'Order',
            description: 'Select the order to retrieve.',
            required: true,
            auth: lemonSqueezyAuth,
            refreshers: ['auth'],
            options: async ({ auth }) => {
                if (!auth) {
                    return { disabled: true, placeholder: 'Connect your account first.', options: [] }
                }
                const options = await fetchOrderOptions(auth.secret_text)
                return { options }
            },
        }),
    },
    async run(context) {
        const { auth, propsValue } = context

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${LEMON_SQUEEZY_API_BASE}/orders/${propsValue.orderId}`,
            headers: getLemonSqueezyHeaders(auth.secret_text),
        })

        return response.body
    },
})
