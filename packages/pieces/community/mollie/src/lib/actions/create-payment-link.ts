import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { MollieAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import {
  customerIdDropdown,
  currencyDropdown,
  paymentMethodDropdown,
  profileIdDropdown,
} from '../common/props';

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
    amount_currency: currencyDropdown('Amount Currency'),
    amount_value: Property.ShortText({
      displayName: 'Amount Value',
      description:
        'Exact monetary amount string with 2 decimals (e.g. 1000.00)',
      required: false,
    }),
    minimumAmount_currency: currencyDropdown('Minimum Amount Currency'),
    minimumAmount_value: Property.ShortText({
      displayName: 'Minimum Amount Value',
      description:
        'Exact monetary amount string with 2 decimals (e.g. 5.00). Only when no amount is set.',
      required: false,
    }),
    redirectUrl: Property.ShortText({
      displayName: 'Redirect URL',
      description:
        'URL to redirect customer after successful payment. Required for most payment methods except recurring payments and Apple Pay.',
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
     profileId: profileIdDropdown,
    allowedMethods: paymentMethodDropdown,
   
    billing_organizationName: Property.ShortText({
      displayName: 'Organization Name',
      required: false,
    }),
    billing_title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    billing_givenName: Property.ShortText({
      displayName: 'Given Name',
      required: true,
    }),
    billing_familyName: Property.ShortText({
      displayName: 'Family Name',
      required: true,
    }),
    billing_email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    billing_phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    billing_streetAndNumber: Property.ShortText({
      displayName: 'Street and Number',
      required: true,
    }),
    billing_streetAdditional: Property.ShortText({
      displayName: 'Additional Address',
      required: false,
    }),
    billing_postalCode: Property.ShortText({
      displayName: 'Postal Code',
      required: true,
    }),
    billing_city: Property.ShortText({
      displayName: 'City',
      required: true,
    }),
    billing_region: Property.ShortText({
      displayName: 'Region',
      required: false,
    }),
    billing_country: Property.ShortText({
      displayName: 'Country',
      description: 'Two-letter ISO country code',
      required: true,
    }),
    shippingAddress_organizationName: Property.ShortText({
      displayName: 'Shipping Organization Name',
      required: false,
    }),
    shippingAddress_title: Property.ShortText({
      displayName: 'Shipping Title',
      required: false,
    }),
    shippingAddress_givenName: Property.ShortText({
      displayName: 'Shipping Given Name',
      required: false,
    }),
    shippingAddress_familyName: Property.ShortText({
      displayName: 'Shipping Family Name',
      required: false,
    }),
    shippingAddress_email: Property.ShortText({
      displayName: 'Shipping Email',
      required: false,
    }),
    shippingAddress_phone: Property.ShortText({
      displayName: 'Shipping Phone',
      required: false,
    }),
    shippingAddress_streetAndNumber: Property.ShortText({
      displayName: 'Shipping Street and Number',
      required: false,
    }),
    shippingAddress_streetAdditional: Property.ShortText({
      displayName: 'Shipping Additional Address',
      required: false,
    }),
    shippingAddress_postalCode: Property.ShortText({
      displayName: 'Shipping Postal Code',
      required: false,
    }),
    shippingAddress_city: Property.ShortText({
      displayName: 'Shipping City',
      required: false,
    }),
    shippingAddress_region: Property.ShortText({
      displayName: 'Shipping Region',
      required: false,
    }),
    shippingAddress_country: Property.ShortText({
      displayName: 'Shipping Country',
      description: 'Two-letter ISO country code',
      required: false,
    }),
    sequenceType: Property.StaticDropdown({
      displayName: 'Sequence Type',
      description:
        'first = establish mandate after payment; oneoff = regular link',
      required: false,
      defaultValue: 'oneoff',
      options: {
        options: [
          { label: 'oneoff', value: 'oneoff' },
          { label: 'first', value: 'first' },
        ],
      },
    }),
    lines: Property.Array({
      displayName: 'Lines',
      required: false,
      properties: {
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: false,
          defaultValue: 'physical',
          options: {
            options: [
              { label: 'physical', value: 'physical' },
              { label: 'digital', value: 'digital' },
              { label: 'shipping_fee', value: 'shipping_fee' },
              { label: 'discount', value: 'discount' },
              { label: 'store_credit', value: 'store_credit' },
              { label: 'gift_card', value: 'gift_card' },
              { label: 'surcharge', value: 'surcharge' },
            ],
          },
        }),
        description: Property.ShortText({
          displayName: 'Description',
          required: true,
        }),
        quantity: Property.Number({ displayName: 'Quantity', required: true }),
        quantityUnit: Property.ShortText({
          displayName: 'Quantity Unit',
          required: false,
        }),
        unitPrice_value: Property.ShortText({
          displayName: 'Unit Price (value)',
          description: 'String with 2 decimals (e.g. 89.00)',
          required: true,
        }),
        discountAmount_value: Property.ShortText({
          displayName: 'Discount Amount (value)',
          description: 'Positive amount; optional',
          required: false,
        }),
        totalAmount_value: Property.ShortText({
          displayName: 'Total Amount (value)',
          description: '(unitPrice × quantity) - discountAmount',
          required: true,
        }),
        vatRate: Property.ShortText({
          displayName: 'VAT Rate',
          required: false,
        }),
        vatAmount_value: Property.ShortText({
          displayName: 'VAT Amount (value)',
          description: 'String with 2 decimals; optional',
          required: false,
        }),
        sku: Property.ShortText({
          displayName: 'SKU/EAN/ISBN/UPC',
          required: false,
        }),
        categories: Property.StaticMultiSelectDropdown({
          displayName: 'Voucher Categories',
          required: false,
          options: {
            options: [
              { label: 'meal', value: 'meal' },
              { label: 'eco', value: 'eco' },
              { label: 'gift', value: 'gift' },
              { label: 'sport_culture', value: 'sport_culture' },
            ],
          },
        }),
        imageUrl: Property.ShortText({
          displayName: 'Image URL',
          required: false,
        }),
        productUrl: Property.ShortText({
          displayName: 'Product URL',
          required: false,
        }),
      },
    }),
    applicationFee_amount_currency: currencyDropdown(
      'Application Fee Currency'
    ),
    applicationFee_amount_value: Property.ShortText({
      displayName: 'Application Fee Value',
      description: 'String with 2 decimals (e.g. 0.99)',
      required: false,
    }),
    applicationFee_description: Property.ShortText({
      displayName: 'Application Fee Description',
      description: 'Required when application fee is set',
      required: false,
    }),
    reusable: Property.Checkbox({
      displayName: 'Reusable',
      description: 'Allow this payment link to be used multiple times',
      required: false,
    }),
    customerId: customerIdDropdown,
  },
  async run({ auth, propsValue }) {
    const paymentLinkData: any = {
      description: propsValue.description,
    };
    const isApplePayOnly = propsValue.allowedMethods;

    const isRecurringSequence = propsValue.sequenceType === 'recurring';

    if (!propsValue.redirectUrl && !isApplePayOnly && !isRecurringSequence) {
      throw new Error(
        "redirectUrl is required for most payment methods. It's only optional for Apple Pay only payments or recurring sequence types."
      );
    }
    if (propsValue.amount_currency && propsValue.amount_value) {
      paymentLinkData.amount = {
        currency: propsValue.amount_currency,
        value: propsValue.amount_value,
      };
    }

    if (
      propsValue.minimumAmount_currency &&
      propsValue.minimumAmount_value &&
      !paymentLinkData.amount
    ) {
      paymentLinkData.minimumAmount = {
        currency: propsValue.minimumAmount_currency,
        value: propsValue.minimumAmount_value,
      };
    }

    const billingFields = {
      organizationName: propsValue.billing_organizationName,
      title: propsValue.billing_title,
      givenName: propsValue.billing_givenName,
      familyName: propsValue.billing_familyName,
      email: propsValue.billing_email,
      phone: propsValue.billing_phone,
      streetAndNumber: propsValue.billing_streetAndNumber,
      streetAdditional: propsValue.billing_streetAdditional,
      postalCode: propsValue.billing_postalCode,
      city: propsValue.billing_city,
      region: propsValue.billing_region,
      country: propsValue.billing_country,
    };

    const billingAddress = Object.fromEntries(
      Object.entries(billingFields).filter(
        ([key, value]) => value !== undefined && value !== null && value !== ''
      )
    );

    if (Object.keys(billingAddress).length > 0) {
      paymentLinkData.billingAddress = billingAddress;
    }

    const shippingFields = {
      organizationName: propsValue.shippingAddress_organizationName,
      title: propsValue.shippingAddress_title,
      givenName: propsValue.shippingAddress_givenName,
      familyName: propsValue.shippingAddress_familyName,
      email: propsValue.shippingAddress_email,
      phone: propsValue.shippingAddress_phone,
      streetAndNumber: propsValue.shippingAddress_streetAndNumber,
      streetAdditional: propsValue.shippingAddress_streetAdditional,
      postalCode: propsValue.shippingAddress_postalCode,
      city: propsValue.shippingAddress_city,
      region: propsValue.shippingAddress_region,
      country: propsValue.shippingAddress_country,
    };

    const shippingAddress = Object.fromEntries(
      Object.entries(shippingFields).filter(
        ([key, value]) => value !== undefined && value !== null && value !== ''
      )
    );

    if (Object.keys(shippingAddress).length > 0) {
      paymentLinkData.shippingAddress = shippingAddress;
    }

    if (propsValue.lines && propsValue.lines.length > 0) {
      paymentLinkData.lines = propsValue.lines.map((line: any) => {
        const processedLine: any = {
          type: line.type || 'physical',
          description: line.description,
          quantity: line.quantity,
          unitPrice: {
            currency: propsValue.amount_currency || 'EUR',
            value: line.unitPrice_value,
          },
          totalAmount: {
            currency: propsValue.amount_currency || 'EUR',
          },
        };

        if (line.quantityUnit) processedLine.quantityUnit = line.quantityUnit;
        if (line.discountAmount_value) {
          processedLine.discountAmount = {
            currency: propsValue.amount_currency || 'EUR',
            value: line.discountAmount_value,
          };
        }
        if (line.vatRate) processedLine.vatRate = line.vatRate;
        if (line.vatAmount_value) {
          processedLine.vatAmount = {
            currency: propsValue.amount_currency || 'EUR',
            value: line.vatAmount_value,
          };
        }
        if (line.sku) processedLine.sku = line.sku;
        if (line.categories && line.categories.length > 0)
          processedLine.categories = line.categories;
        if (line.imageUrl) processedLine.imageUrl = line.imageUrl;
        if (line.productUrl) processedLine.productUrl = line.productUrl;

        return processedLine;
      });
    }

    if (
      propsValue.applicationFee_amount_currency &&
      propsValue.applicationFee_amount_value
    ) {
      if (!propsValue.applicationFee_description) {
        throw new Error(
          'Application fee description is required when application fee is set'
        );
      }

      paymentLinkData.applicationFee = {
        amount: {
          currency: propsValue.applicationFee_amount_currency,
          value: propsValue.applicationFee_amount_value,
        },
        description: propsValue.applicationFee_description,
      };
    }

    if (propsValue.sequenceType) {
      paymentLinkData.sequenceType = propsValue.sequenceType;

      // Customer ID is only relevant for 'first' sequence type
      if (propsValue.sequenceType === 'first' && propsValue.customerId) {
        paymentLinkData.customerId = propsValue.customerId;
      }
    }

    if (propsValue.redirectUrl) {
      paymentLinkData.redirectUrl = propsValue.redirectUrl;
    }

    if (propsValue.webhookUrl) {
      paymentLinkData.webhookUrl = propsValue.webhookUrl;
    }

    if (propsValue.expiresAt) {
      paymentLinkData.expiresAt = propsValue.expiresAt;
    }

    if (propsValue.allowedMethods) {
      paymentLinkData.allowedMethods = propsValue.allowedMethods;
    }

    if (propsValue.profileId) {
      paymentLinkData.profileId = propsValue.profileId;
    }

    if (propsValue.reusable !== undefined) {
      paymentLinkData.reusable = propsValue.reusable;
    }

    if (
      propsValue.minimumAmount_currency &&
      propsValue.minimumAmount_value &&
      paymentLinkData.amount
    ) {
      console.warn('Minimum amount is ignored when fixed amount is set');
    }

    if (propsValue.customerId && propsValue.sequenceType !== 'first') {
      console.warn('Customer ID is only used when sequence type is "first"');
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/payment-links',
      paymentLinkData
    );

    return response;
  },
});
