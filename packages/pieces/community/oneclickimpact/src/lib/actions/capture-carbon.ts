import { createAction, Property } from '@activepieces/pieces-framework';
import { oneclickimpactAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
export const captureCarbon = createAction({
  auth: oneclickimpactAuth,
  name: 'captureCarbon',
  displayName: 'Capture carbon',
  description: 'Capture carbon for yourself or on behalf of the customer',
  audience: 'both',
  aiMetadata: { description: 'Purchases carbon capture through 1ClickImpact for a given amount (in lbs, 1 to 10,000,000), optionally attributed to a named customer email/name. Use to offset emissions as part of a transaction or fulfillment flow. Not idempotent — each call records a new capture, so repeating it captures additional carbon.', idempotent: false },
  props: {
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The amount of carbon to capture in lbs (1 and 10,000,000)',
      required: true,
    }),
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      description:
        'The email of the customer on whose behalf the carbon is being captured',
      required: false,
    }),
    customerName: Property.ShortText({
      displayName: 'Customer Name',
      description:
        'The name of the customer on whose behalf the carbon is being captured',
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
      '/capture_carbon',
      body
    );
    return response;
  },
});
