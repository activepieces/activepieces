import { createAction, Property } from '@activepieces/pieces-framework';

import { saleorAuth } from '../..';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const saleorRawGraphqlQuery = createAction({
    name: 'rawGraphqlQuery',
    displayName: 'Raw GraphQL query',
    description: 'Perform a raw GraphQL query',
    auth: saleorAuth,
    props: {
        query: Property.LongText({ displayName: 'Query', required: true }),
            variables: Property.Object({ displayName: 'Parameters', required: false }),
    },
    async run({auth, propsValue}) {
        const { query, variables } = propsValue;
        const { token, apiUrl } = auth;

        const response = await httpClient.sendRequest({
            url: apiUrl,
            method: HttpMethod.POST,
            body: JSON.stringify({
                query: query,
                variables: variables,
            }),
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: token,
            },
        });

        return response;
    },
});
