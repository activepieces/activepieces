import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { MollieAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { currencyDropdown, paymentMethodDropdown } from '../common/props';

export const createPaymentLink = createAction({
  auth: MollieAuth,
  name: 'createPaymentLink',
  displayName: 'Create Payment Link',
  description:
    'Create a payment link that can be shared with customers to collect payments',
  props: {
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the payment link',
      required: true,
    }),
    amount_currency: currencyDropdown,
    amount_value: Property.ShortText({
      displayName: 'Amount Value',
      description:
        'Amount value in the smallest currency unit (e.g. cents for EUR)',
      required: true,
    }),
    redirectUrl: Property.ShortText({
      displayName: 'Redirect URL',
      description: 'URL to redirect customer after successful payment',
      required: false,
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'URL for payment status webhooks',
      required: false,
    }),
    expiresAt: Property.ShortText({
      displayName: 'Expires At',
      description:
        'Payment link expiration date (ISO 8601 format, e.g. 2024-12-31T23:59:59Z)',
      required: false,
    }),
    allowedMethods: paymentMethodDropdown,
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'Mollie profile ID to use for this payment link (optional)',
      required: false,
    }),
    reusable: Property.Checkbox({
      displayName: 'Reusable',
      description: 'Allow this payment link to be used multiple times',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Custom metadata object for storing additional information',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const paymentLinkData: any = {
      description: propsValue.description,
      amount: {
        currency: propsValue.amount_currency,
        value: propsValue.amount_value,
      },
    };

    // Add optional fields if provided
    if (propsValue.redirectUrl) {
      paymentLinkData.redirectUrl = propsValue.redirectUrl;
    }
    if (propsValue.webhookUrl) {
      paymentLinkData.webhookUrl = propsValue.webhookUrl;
    }
    if (propsValue.expiresAt) {
      paymentLinkData.expiresAt = propsValue.expiresAt;
    }
    // if (propsValue.allowedMethods && propsValue.allowedMethods.length > 0) {
    //   paymentLinkData.allowedMethods = propsValue.allowedMethods;
    // }
    if (propsValue.profileId) {
      paymentLinkData.profileId = propsValue.profileId;
    }
    if (propsValue.reusable !== undefined) {
      paymentLinkData.reusable = propsValue.reusable;
    }
    if (propsValue.metadata) {
      paymentLinkData.metadata = propsValue.metadata;
    }

    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      '/payment-links',
      paymentLinkData
    );

    return response;
  },
});
