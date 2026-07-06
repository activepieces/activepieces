import { createAction, Property } from '@activepieces/pieces-framework';
import { oneclickimpactAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
export const donateMoney = createAction({
  auth: oneclickimpactAuth,
  name: 'donateMoney',
  displayName: 'Donate Money',
  description: ' Donate money to support environmental causes',
  audience: 'both',
  aiMetadata: { description: 'Makes a monetary donation to environmental causes through 1ClickImpact for an amount in USD (minimum $1.00, converted to cents internally), optionally attributed to a named customer email/name. Use to fund impact as part of a transaction or fulfillment flow. Not idempotent — each call records a new donation, so repeating it donates again.', idempotent: false },
  props: {
    amount: Property.Number({
      displayName: 'Amount (USD)',
      description: 'The amount in USD you wish to donate. Minimum $1.00',
      required: true,
    }),
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      description:
        'The email of the customer on whose behalf the donation is being made',
      required: false,
    }),
    customerName: Property.ShortText({
      displayName: 'Customer Name',
      description:
        'The name of the customer on whose behalf the donation is being made',
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
      customerEmail: propsValue.customerEmail,
      customerName: propsValue.customerName,
      notify: propsValue.notify,
    };
    const amountInCents = Math.round(propsValue.amount * 100);

    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      '/donate_money',
      { ...body, amount: amountInCents }
    );
    return response;
  },
});
