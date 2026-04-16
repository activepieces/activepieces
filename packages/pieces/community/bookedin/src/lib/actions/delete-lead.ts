import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { bookedinAuth } from '../auth'
import { BASE_URL, extractApiKey, getBookedinHeaders, leadIdDropdown } from '../common/props'

export const deleteLead = createAction({
    name: 'deleteLead',
    displayName: 'Delete Lead',
    description: 'Delete a lead.',
    auth: bookedinAuth,
    props: {
        lead_id: leadIdDropdown,
    },
    async run({ auth, propsValue }) {
        const apiKey = extractApiKey(auth)

        const response = await httpClient.sendRequest({
            method: HttpMethod.DELETE,
            url: `${BASE_URL}/leads/${propsValue.lead_id}`,
            headers: getBookedinHeaders(apiKey),
        })

        return response.body
    },
})
