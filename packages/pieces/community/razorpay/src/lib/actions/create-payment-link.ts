import { createAction, Property } from '@activepieces/pieces-framework';
import { generateRazorpayAuthHeader, RazorpayCredentials } from '../common/utils';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { razorpayAuth } from '../..';



export const createPaymentlink = createAction({
  name: 'create-payment-link',
  classification: 'WRITE',
  auth: razorpayAuth,
  displayName: 'Create Payment Link',
  description: 'Create a payment link and optionally send it to the customer.',
  audience: 'both',
  aiMetadata: { description: 'Creates a new Razorpay payment link for a given amount and currency, optionally notifying the customer by SMS and/or email. Use to collect a one-off payment from a customer; amount is specified in major currency units (e.g. rupees) and is converted to the smallest unit internally. Not idempotent — each call generates a new payment link.', idempotent: false },
  propertyGroups: [
    {
      key: 'payment',
      display: 'section',
      label: 'Payment',
      icon: 'tag',
      props: ['amount', 'currency', 'description'],
    },
    {
      key: 'customer',
      display: 'section',
      label: 'Customer',
      icon: 'user',
      props: ['customer_name', 'customer_contact', 'customer_email'],
    },
    {
      key: 'notifications',
      display: 'section',
      label: 'Notifications',
      icon: 'send',
      props: ['notify_sms', 'notify_email'],
    },
  ],
  props: {
    amount: Property.Number({
      displayName: 'Amount',
      description: 'In the main currency unit, such as rupees, not paise.',
      required: true,
      width: 'half',
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Three-letter currency code.',
      placeholder: 'INR',
      required: true,
      defaultValue: 'INR',
      width: 'half',
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'What the payment is for, shown to the customer.',
      placeholder: 'Order #1042',
      required: false,
    }),
    customer_name: Property.ShortText({
      displayName: 'Customer Name',
      placeholder: 'Gaurav Kumar',
      required: false,
    }),
    customer_contact: Property.ShortText({
      displayName: 'Customer Phone',
      description: 'Phone with country code, used for SMS notifications.',
      placeholder: '+919000090000',
      required: true,
      defaultValue: '+91',
      width: 'half',
    }),
    customer_email: Property.ShortText({
      displayName: 'Customer Email',
      description: 'Email notifications go here.',
      placeholder: 'you@example.com',
      required: false,
      width: 'half',
    }),
    notify_sms: Property.Checkbox({
      displayName: 'Notify via SMS',
      description: "Text the link to the customer's phone.",
      required: false,
      defaultValue: true,
    }),
    notify_email: Property.Checkbox({
      displayName: 'Notify via Email',
      description: 'Email the link to the customer.',
      required: false,
      defaultValue: true,
    }),
    reference_id: Property.ShortText({
      displayName: 'Reference ID',
      description: 'Your own unique ID for this link, such as an order number.',
      placeholder: 'ORD-1042',
      required: false,
      advanced: true,
    }),
    metafield_notes: Property.ShortText({
      displayName: 'Note',
      description: 'Saved on the link for your records.',
      required: false,
      advanced: true,
    }),
    callback_url: Property.ShortText({
      displayName: 'Callback URL',
      description: 'Page to send the customer to after they pay.',
      placeholder: 'https://example.com/thank-you',
      required: false,
      advanced: true,
    }),
    callback_method: Property.ShortText({
      displayName: 'Callback Method',
      description: 'Only get is accepted, and it is set for you with a callback URL.',
      placeholder: 'get',
      required: false,
      advanced: true,
    }),
  },
  async run(context) {
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
      callback_method: context.propsValue.callback_method || (context.propsValue.callback_url ? 'get' : undefined),
    };

    const authHeader = await generateRazorpayAuthHeader(context.auth.props);

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