import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { deepgramAuth } from '../common/auth'
import { BASE_URL } from '../common/constants'

export const listProjectsAction = createAction({
    auth: deepgramAuth,
    name: 'list_projects',
    displayName: 'List Projects',
    description: 'Retrieves a list of all projects associated with the account.',
    props: {},
    async run(context) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: BASE_URL + '/projects',
            headers: {
                Authorization: `Token ${context.auth.secret_text}`,
            },
        })

        return response.body
    },
})
