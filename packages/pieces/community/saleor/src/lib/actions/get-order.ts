import { createAction, Property } from '@activepieces/pieces-framework';

import { saleorAuth } from '../..';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getOrder = createAction({
    name: 'getOrder',
    displayName: 'Get an order',
    description: 'Get an order according to the ID',
    auth: saleorAuth,
    props: {
      orderId: Property.ShortText({ 
        displayName: 'The ID of the order',
        required: true 
      }),
    },
    async run({auth, propsValue}) {
        const orderId = propsValue.orderId
        const { token, apiUrl } = auth;

        const query = `
            query GetOrder($orderId: ID!) {
                order(id: $orderId) {
                    id
                    number
                    created
                    status
                    
                    total {
                        gross {
                            amount
                            currency
                        }
                    }
                    
                    user {
                        email
                        firstName
                        lastName
                    }
                    
                    lines {
                        productName
                        variantName
                        quantity
                        unitPrice {
                            gross {
                                amount
                                currency
                            }
                        }
                    }
                }
            }
        `

        const response = await httpClient.sendRequest({
            url: apiUrl,
            method: HttpMethod.POST,
            body: JSON.stringify({
                query: query,
                variables: { orderId }
            }),
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: token,
            },
        });

        return response;
    },
});
