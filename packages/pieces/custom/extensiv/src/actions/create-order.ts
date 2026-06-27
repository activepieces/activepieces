import { createAction, Property } from '@activepieces/pieces-framework';

import { extensivAuth } from '../lib/auth';
import { ExtensivClient } from '../lib/common';
import { ExtensivCredentials } from '../lib/types';

export const createOrderAction = createAction({
  auth: extensivAuth,
  name: 'create_order',
  displayName: 'Create Order',
  description: 'Create a new order in Extensiv.',

  props: {
    order: Property.Json({
      displayName: 'Order',
      description:
        'The complete Extensiv order payload as a JSON object.',
      required: true,
      defaultValue: {
        "referenceNum": "SO-10001",
        "customerIdentifier": "1001",
        "warehouseIdentifier": "MAIN",
        "orderItems": [
            {
            "itemIdentifier": "SKU-001",
            "qty": 2
            }
            ]
        }   
    }),
  },

  async run(context) {
    const auth: ExtensivCredentials = {
      baseUrl: context.auth.props.baseUrl,
      clientId: context.auth.props.clientId,
      clientSecret: context.auth.props.clientSecret,
      userLogin: context.auth.props.userLogin,
    };

    const client = new ExtensivClient(auth);

    return client.createOrder(
      context.propsValue.order as Record<string, unknown>,
    );
  },
});