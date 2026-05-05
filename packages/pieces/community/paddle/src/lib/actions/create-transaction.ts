import { createAction, Property } from '@activepieces/pieces-framework';

import { paddleAuth } from '../auth';
import { paddleClient } from '../common/client';
import { paddleProps } from '../common/props';
import { paddleUtils } from '../common/utils';

const createTransactionAction = createAction({
  auth: paddleAuth,
  name: 'create-transaction',
  displayName: 'Create Transaction',
  description:
    'Creates a Paddle transaction. When you use recurring prices, completing the transaction starts the subscription.',
  props: {
    customerId: paddleProps.customer(),
    addressId: paddleProps.address(),
    priceId: paddleProps.recurringPrice(),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'Optional quantity for the recurring price.',
      required: false,
    }),
    customData: Property.Json({
      displayName: 'Custom Data',
      description: 'Optional JSON object to store on the transaction.',
      required: false,
    }),
  },
  async run(context) {
    const customerId = paddleUtils.getRequiredString({
      value: context.propsValue.customerId,
      fieldName: 'Customer',
    });
    const addressId = paddleUtils.getRequiredString({
      value: context.propsValue.addressId,
      fieldName: 'Address ID',
    });
    const priceId = paddleUtils.getRequiredString({
      value: context.propsValue.priceId,
      fieldName: 'Recurring Price',
    });
    const quantity = paddleUtils.getOptionalPositiveInteger({
      value: context.propsValue.quantity,
      fieldName: 'Quantity',
    });
    const customData = paddleUtils.getOptionalObject({
      value: context.propsValue.customData,
      fieldName: 'Custom Data',
    });

    return paddleClient.createTransaction({
      auth: context.auth,
      request: paddleUtils.compactRecord({
        address_id: addressId,
        customer_id: customerId,
        custom_data: customData,
        items: [
          paddleUtils.compactRecord({
            price_id: priceId,
            quantity,
          }),
        ],
      }),
    });
  },
});

export { createTransactionAction };
