import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { MollieAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import {
  currencyDropdown,
  customerIdDropdown,
  localeDropdown,
  mandatesIdDropdown,
  paymentMethodDropdown,
} from '../common/props';

export const createPayment = createAction({
  auth: MollieAuth,
  name: 'createPayment',
  displayName: 'Create Payment',
  description: 'Create a new payment with Mollie',
  props: {
    amount_currency: currencyDropdown,
    amount_value: Property.ShortText({
      displayName: 'Amount Value',
      description:
        'Amount value in the smallest currency unit (e.g. cents for EUR)',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the payment',
      required: true,
    }),
    redirectUrl: Property.ShortText({
      displayName: 'Redirect URL',
      description: 'URL to redirect customer after payment',
      required: true,
    }),
    cancelUrl: Property.ShortText({
      displayName: 'Cancel URL',
      description: 'URL to redirect customer if they cancel the payment',
      required: false,
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'URL for payment status webhooks',
      required: false,
    }),
    method: paymentMethodDropdown,
    locale: localeDropdown,
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Custom metadata object for storing additional information',
      required: false,
    }),
    sequenceType: Property.StaticDropdown({
      displayName: 'Sequence Type',
      description: 'Type of recurring payment (for subscriptions)',
      required: false,
      defaultValue: 'oneoff',
      options: {
        options: [
          { label: 'One-off payment', value: 'oneoff' },
          { label: 'First recurring payment', value: 'first' },
          { label: 'Recurring payment', value: 'recurring' },
        ],
      },
    }),
    customerId: customerIdDropdown,
    mandateId: mandatesIdDropdown,
    restrictPaymentMethodsToCountry: Property.ShortText({
      displayName: 'Restrict to Country',
      description: 'Two-letter ISO country code to restrict payment methods',
      required: false,
    }),
    billingEmail: Property.ShortText({
      displayName: 'Billing Email',
      description: 'Customer email for billing purposes',
      required: false,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date for bank transfers (YYYY-MM-DD format)',
      required: false,
    }),
    expiresAt: Property.ShortText({
      displayName: 'Expires At',
      description: 'Payment expiration date (ISO 8601 format)',
      required: false,
    }),
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'Mollie profile ID to use for this payment',
      required: false,
    }),
    issuer: Property.ShortText({
      displayName: 'Issuer',
      description: 'Payment method specific issuer (e.g. for iDEAL)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const paymentData: any = {
      amount: {
        currency: propsValue.amount_currency,
        value: propsValue.amount_value,
      },
      description: propsValue.description,
      redirectUrl: propsValue.redirectUrl,
    };

    // Add optional fields if provided
    if (propsValue.webhookUrl) {
      paymentData.webhookUrl = propsValue.webhookUrl;
    }
    if (propsValue.method) {
      paymentData.method = propsValue.method;
    }
    if (propsValue.locale) {
      paymentData.locale = propsValue.locale;
    }
    if (propsValue.metadata) {
      paymentData.metadata = propsValue.metadata;
    }
    if (propsValue.sequenceType) {
      paymentData.sequenceType = propsValue.sequenceType;
    }
    if (propsValue.customerId) {
      paymentData.customerId = propsValue.customerId;
    }
    if (propsValue.mandateId) {
      paymentData.mandateId = propsValue.mandateId;
    }
    if (propsValue.restrictPaymentMethodsToCountry) {
      paymentData.restrictPaymentMethodsToCountry =
        propsValue.restrictPaymentMethodsToCountry;
    }
    if (propsValue.billingEmail) {
      paymentData.billingEmail = propsValue.billingEmail;
    }
    if (propsValue.dueDate) {
      paymentData.dueDate = propsValue.dueDate;
    }
    if (propsValue.expiresAt) {
      paymentData.expiresAt = propsValue.expiresAt;
    }
    if (propsValue.profileId) {
      paymentData.profileId = propsValue.profileId;
    }
    if (propsValue.issuer) {
      paymentData.issuer = propsValue.issuer;
    }

    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      '/payments',
      paymentData
    );

    return response;
  },
});
