import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { timeOpsAuth } from '../..';
import { timeOpsClient } from '../common';

export const createCustomer = createAction({
  auth: timeOpsAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Creates a customer.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the customer.',
      required: false,
    }),
    vatNumber: Property.ShortText({
      displayName: 'VAT Number',
      description: 'The VAT number of the customer.',
      required: false,
    }),
    defaultRate: Property.Number({
      displayName: 'Default Rate',
      description: 'The default hourly rate for this customer.',
      required: false,
    }),
  },
  async run(context) {
    const { name, vatNumber, defaultRate } = context.propsValue;

    return await timeOpsClient.makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/customers',
      {
        name: name ?? null,
        vatNumber: vatNumber ?? null,
        defaultRate: defaultRate ?? null,
      }
    );
  },
});
