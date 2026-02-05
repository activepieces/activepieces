import { createAction, Property } from '@activepieces/pieces-framework';
import { oneclickimpactAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const plantTrees = createAction({
  auth: oneclickimpactAuth,
  name: 'plantTrees',
  displayName: 'Plant Trees',
  description: 'Plant trees for yourself or on behalf of the customer',
  props: {
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The number of trees to plant (1 and 10,000,000)',
      required: true,
    }),
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      description:
        'The email of the customer on whose behalf the trees are being planted',
      required: false,
    }),
    customerName: Property.ShortText({
      displayName: 'Customer Name',
      description:
        'The name of the customer on whose behalf the trees are being planted',
      required: false,
    }),
    notify: Property.Checkbox({
      displayName: 'Notify',
      description: 'Notification preference',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: any = {
      amount: propsValue.amount,
      customerEmail: propsValue.customerEmail,
      customerName: propsValue.customerName,
      notify: propsValue.notify,
    };

    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      '/plant_trees',
      body
    );
    return response;
  },
});
