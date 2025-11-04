import { createAction, Property } from '@activepieces/pieces-framework';

import { saleorAuth } from '../..';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const addOrderNote = createAction({
  name: 'addOrderNote',
  displayName: 'Add Order Note',
  description: 'Add a note to a Saleor order',
  auth: saleorAuth,
  props: {
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'The ID of the order',
      required: true
    }),
    message: Property.LongText({
      displayName: 'Note Message',
      description: 'The content of the note',
      required: true
    })
  },
  async run({auth, propsValue}) {
    const { orderId, message } = propsValue;
    const { token, apiUrl } = auth;

    const query = `
        mutation AddOrderNote($orderId: ID!, $message: String!) {
            orderNoteAdd(
                order: $orderId,
                input: {
                    message: $message,
                }
            ) {
                order {
                    id
                    number
                }
            }
        }
    `

    const response = await httpClient.sendRequest({
        url: apiUrl,
        method: HttpMethod.POST,
        body: JSON.stringify({
            query: query,
            variables: { orderId, message }
        }),
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
        },
    });

    return response;
  }
});