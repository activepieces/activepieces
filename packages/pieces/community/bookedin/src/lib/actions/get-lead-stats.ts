import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { bookedinAuth } from '../auth'
import { BASE_URL, extractApiKey, getBookedinHeaders } from '../common/props'

export const getLeadStats = createAction({
    name: 'getLeadStats',
    displayName: 'Get Lead Stats',
    description: 'Get lead statistics (Hot, Warm, Cold, Objectives Met, Total).',
    auth: bookedinAuth,
    props: {},
    async run({ auth }) {
        const apiKey = extractApiKey(auth)

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${BASE_URL}/leads/stats`,
            headers: getBookedinHeaders(apiKey),
        })

        return response.body
    },
})
