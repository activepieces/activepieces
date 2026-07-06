import { createAction, Property } from '@activepieces/pieces-framework';

import { saleorAuth } from '../..';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const saleorRawGraphqlQuery = createAction({
    name: 'rawGraphqlQuery',
    displayName: 'Raw GraphQL query',
    description: 'Perform a raw GraphQL query',
    audience: 'both',
    aiMetadata: { description: 'Sends an arbitrary GraphQL operation (query or mutation) to the Saleor GraphQL endpoint with optional variables. Use this as the escape hatch when no dedicated action covers the data or operation you need. Not idempotent in general: it can run mutations, so repeating it may create or change data depending on the operation you supply.', idempotent: false },
    auth: saleorAuth,
    props: {
        query: Property.LongText({ displayName: 'Query', required: true }),
            variables: Property.Object({ displayName: 'Parameters', required: false }),
    },
    async run({auth, propsValue}) {
        const { query, variables } = propsValue;
        const { token, apiUrl } = auth.props;

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
