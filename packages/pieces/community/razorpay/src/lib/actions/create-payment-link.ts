import { createAction, Property } from '@activepieces/pieces-framework';
import { generateRazorpayAuthHeader, RazorpayCredentials } from '../common/utils';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { razorpayAuth } from '../..';



export const createPaymentlink = createAction({
  name: 'create-payment-link',
  auth: razorpayAuth,
  displayName: 'Create Payment Link',
  description: 'Create a payment link',
  props: {
    amount: Property.Number({
      displayName: 'Amount',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      required: true,
      defaultValue: 'INR',
    }),
    reference_id: Property.ShortText({
      displayName: 'Reference ID',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    customer_name: Property.ShortText({
      displayName: 'Customer Name',
      required: false,
    }),
    customer_contact: Property.ShortText({
      displayName: 'Customer Contact',
      required: true,
      defaultValue: '+91',
    }),
    notify_sms: Property.Checkbox({
      displayName: 'Notify via SMS',
      description: 'Send notification via SMS',
      required: false,
      defaultValue: true,
    }),
    customer_email: Property.ShortText({
      displayName: 'Customer Email',
      required: false,
    }),
    notify_email: Property.Checkbox({
      displayName: 'Notify via Email',
      description: 'Send notification via Email',
      required: false,
      defaultValue: true,
    }),
    metafield_notes: Property.ShortText({
      displayName: 'Notes',
      required: false,
    }),
    callback_url: Property.ShortText({
      displayName: 'Callback URL',
      required: false,
    }),
    callback_method: Property.ShortText({
      displayName: 'Callback Method',
      required: false,
    }),
  },
  async run(context) {
    // Convert amount from rupee format to the format expected by Razorpay
    const amountWithoutDecimal = Math.round(context.propsValue.amount * 100);

    const paymentLinkData = {
      amount: amountWithoutDecimal,
      currency: context.propsValue.currency,
      reference_id: context.propsValue.reference_id,
      description: context.propsValue.description,
      customer: {
        name: context.propsValue.customer_name,
        contact: context.propsValue.customer_contact,
        email: context.propsValue.customer_email,
      },
      notify: {
        sms: context.propsValue.notify_sms,
        email: context.propsValue.notify_email,
      },
      notes: {
        policy_name: context.propsValue.metafield_notes,
      },
      callback_url: context.propsValue.callback_url,
      callback_method: context.propsValue.callback_method,
    };

    const authHeader = await generateRazorpayAuthHeader(context.auth as RazorpayCredentials);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.razorpay.com/v1/payment_links',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentLinkData),
    });

    return response.body;
  },
});