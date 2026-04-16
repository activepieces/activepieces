import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { zooAuth } from '../../auth'

export const getOpenApiSchemaAction = createAction({
    name: 'get_openapi_schema',
    displayName: 'Get OpenAPI Schema',
    description: 'Retrieve the OpenAPI schema for the Zoo API',
    auth: zooAuth,
    // category: 'Meta',
    props: {},
    async run({ auth }) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://api.zoo.dev/',
            headers: {
                Authorization: `Bearer ${auth.secret_text}`,
            },
        })
        return response.body
    },
})
