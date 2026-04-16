import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { bookedinAuth } from '../auth'
import { BASE_URL, extractApiKey, getBookedinHeaders, leadIdDropdown } from '../common/props'

export const getLead = createAction({
    name: 'getLead',
    displayName: 'Get Lead',
    description: 'Get a specific lead by ID.',
    auth: bookedinAuth,
    props: {
        lead_id: leadIdDropdown,
    },
    async run({ auth, propsValue }) {
        const apiKey = extractApiKey(auth)

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${BASE_URL}/leads/${propsValue.lead_id}`,
            headers: getBookedinHeaders(apiKey),
        })

        return response.body
    },
})
