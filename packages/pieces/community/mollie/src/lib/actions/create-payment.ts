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
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the payment',
      required: true,
    }),
    amount_currency: currencyDropdown('Amount Currency'),
    amount_value: Property.ShortText({
      displayName: 'Amount Value',
      description: 'Amount value as decimal string (e.g. "10.99" for €10.99)',
      required: true,
    }),
    redirectUrl: Property.ShortText({
      displayName: 'Redirect URL',
      description:
        'URL to redirect customer after payment. Required except for recurring payments and Apple Pay with payment token.',
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
    includeQrCode: Property.Checkbox({
      displayName: 'Include QR Code (iDEAL, Bancontact, bank transfer)',
      required: false,
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
              { label: 'tip', value: 'tip' },
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
    billing_title: Property.ShortText({
      displayName: 'Billing Title',
      required: false,
    }),
    billing_givenName: Property.ShortText({
      displayName: 'Billing Given Name',
      required: false,
    }),
    billing_familyName: Property.ShortText({
      displayName: 'Billing Family Name',
      required: false,
    }),
    billing_organizationName: Property.ShortText({
      displayName: 'Billing Organization',
      required: false,
    }),
    billing_streetAndNumber: Property.ShortText({
      displayName: 'Billing Street and Number',
      required: false,
    }),
    billing_streetAdditional: Property.ShortText({
      displayName: 'Billing Street Additional',
      required: false,
    }),
    billing_postalCode: Property.ShortText({
      displayName: 'Billing Postal Code',
      required: false,
    }),
    billing_email: Property.ShortText({
      displayName: 'Billing Email',
      required: false,
    }),
    billing_phone: Property.ShortText({
      displayName: 'Billing Phone (E.164)',
      required: false,
    }),
    billing_city: Property.ShortText({
      displayName: 'Billing City',
      required: false,
    }),
    billing_region: Property.ShortText({
      displayName: 'Billing Region/State',
      required: false,
    }),
    billing_country: Property.ShortText({
      displayName: 'Billing Country (ISO 3166-1 alpha-2)',
      required: false,
    }),

    shipping_title: Property.ShortText({
      displayName: 'Shipping Title',
      required: false,
    }),
    shipping_givenName: Property.ShortText({
      displayName: 'Shipping Given Name',
      required: false,
    }),
    shipping_familyName: Property.ShortText({
      displayName: 'Shipping Family Name',
      required: false,
    }),
    shipping_organizationName: Property.ShortText({
      displayName: 'Shipping Organization',
      required: false,
    }),
    shipping_streetAndNumber: Property.ShortText({
      displayName: 'Shipping Street and Number',
      required: false,
    }),
    shipping_streetAdditional: Property.ShortText({
      displayName: 'Shipping Street Additional',
      required: false,
    }),
    shipping_postalCode: Property.ShortText({
      displayName: 'Shipping Postal Code',
      required: false,
    }),
    shipping_email: Property.ShortText({
      displayName: 'Shipping Email',
      required: false,
    }),
    shipping_phone: Property.ShortText({
      displayName: 'Shipping Phone (E.164)',
      required: false,
    }),
    shipping_city: Property.ShortText({
      displayName: 'Shipping City',
      required: false,
    }),
    shipping_region: Property.ShortText({
      displayName: 'Shipping Region/State',
      required: false,
    }),
    shipping_country: Property.ShortText({
      displayName: 'Shipping Country (ISO 3166-1 alpha-2)',
      required: false,
    }),
    // Recurring details (optional)
    recurring_description: Property.ShortText({
      displayName: 'Recurring Description',
      required: false,
    }),
    recurring_interval: Property.ShortText({
      displayName: 'Recurring Interval',
      description: 'e.g., 12 months, 52 weeks, 365 days',
      required: false,
    }),
    recurring_amount_currency: currencyDropdown('Recurring Currency'),
    recurring_amount_value: Property.ShortText({
      displayName: 'Recurring Amount Value',
      description: 'String with 2 decimals (e.g. 9.99)',
      required: false,
    }),
    recurring_times: Property.Number({
      displayName: 'Recurring Times',
      required: false,
    }),
    recurring_startDate: Property.ShortText({
      displayName: 'Recurring Start Date (YYYY-MM-DD)',
      required: false,
    }),
    // Capture controls
    captureMode: Property.StaticDropdown({
      displayName: 'Capture Mode',
      description: 'Set to manual for riverty',
      required: false,
      options: {
        options: [
          { label: 'automatic', value: 'automatic' },
          { label: 'manual', value: 'manual' },
        ],
      },
    }),
    captureDelay: Property.ShortText({
      displayName: 'Capture Delay',
      description: 'e.g. 8 hours or 2 days (max 7 days)',
      required: false,
    }),
    // Application fee (OAuth only)
    applicationFee_amount_currency: Property.StaticDropdown({
      displayName: 'Application Fee Currency',
      required: false,
      options: {
        options: [
          { label: 'EUR - Euro', value: 'EUR' },
          { label: 'USD - US Dollar', value: 'USD' },
          { label: 'GBP - British Pound', value: 'GBP' },
        ],
      },
    }),
    applicationFee_amount_value: Property.ShortText({
      displayName: 'Application Fee Value',
      description: 'String with 2 decimals (e.g. 0.99)',
      required: false,
    }),
    applicationFee_description: Property.ShortText({
      displayName: 'Application Fee Description',
      required: false,
    }),
    // Routing (Connect marketplace split)
    routing: Property.Array({
      displayName: 'Routing',
      required: false,
      properties: {
        amount_currency: Property.StaticDropdown({
          displayName: 'Route Amount Currency',
          required: true,
          options: { options: [{ label: 'EUR - Euro', value: 'EUR' }] },
        }),
        amount_value: Property.ShortText({
          displayName: 'Route Amount Value',
          required: true,
        }),
        destination_organizationId: Property.ShortText({
          displayName: 'Destination Organization ID',
          required: true,
        }),
        releaseDate: Property.ShortText({
          displayName: 'Release Date (YYYY-MM-DD)',
          required: false,
        }),
      },
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

    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date for bank transfers (YYYY-MM-DD format)',
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
    // Runtime validation for redirectUrl
    const isRecurringPayment = propsValue.sequenceType === 'recurring';

    // redirectUrl is required unless it's a recurring payment
    if (!propsValue.redirectUrl && !isRecurringPayment) {
      throw new Error(
        'redirectUrl is required except for recurring payments (sequenceType: recurring).'
      );
    }

    const paymentData: any = {
      amount: {
        currency: propsValue.amount_currency,
        value: propsValue.amount_value,
      },
      description: propsValue.description,
    };

    if (propsValue.redirectUrl) {
      paymentData.redirectUrl = propsValue.redirectUrl;
    }

    if (propsValue.cancelUrl) {
      paymentData.cancelUrl = propsValue.cancelUrl;
    }

    if (propsValue.webhookUrl) {
      paymentData.webhookUrl = propsValue.webhookUrl;
    }
    if (propsValue.includeQrCode !== undefined) {
      paymentData.includeQrCode = propsValue.includeQrCode;
    }

    if (propsValue.lines && propsValue.lines.length > 0) {
      paymentData.lines = propsValue.lines.map((line: any) => {
        const processedLine: any = {
          type: line.type || 'physical',
          description: line.description,
          quantity: line.quantity,
          unitPrice: {
            currency: propsValue.amount_currency,
            value: line.unitPrice_value,
          },
          totalAmount: {
            currency: propsValue.amount_currency,
            value: line.totalAmount_value,
          },
        };

        if (line.quantityUnit) processedLine.quantityUnit = line.quantityUnit;
        if (line.discountAmount_value) {
          processedLine.discountAmount = {
            currency: propsValue.amount_currency,
            value: line.discountAmount_value,
          };
        }
        if (line.vatRate) processedLine.vatRate = line.vatRate;
        if (line.vatAmount_value) {
          processedLine.vatAmount = {
            currency: propsValue.amount_currency,
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

    const billingFields = {
      title: propsValue.billing_title,
      givenName: propsValue.billing_givenName,
      familyName: propsValue.billing_familyName,
      organizationName: propsValue.billing_organizationName,
      streetAndNumber: propsValue.billing_streetAndNumber,
      streetAdditional: propsValue.billing_streetAdditional,
      postalCode: propsValue.billing_postalCode,
      email: propsValue.billing_email,
      phone: propsValue.billing_phone,
      city: propsValue.billing_city,
      region: propsValue.billing_region,
      country: propsValue.billing_country,
    };

    const billing = Object.fromEntries(
      Object.entries(billingFields).filter(
        ([key, value]) => value !== undefined && value !== null && value !== ''
      )
    );

    if (Object.keys(billing).length > 0) {
      paymentData.billing = billing;
    }
    const shippingFields = {
      title: propsValue.shipping_title,
      givenName: propsValue.shipping_givenName,
      familyName: propsValue.shipping_familyName,
      organizationName: propsValue.shipping_organizationName,
      streetAndNumber: propsValue.shipping_streetAndNumber,
      streetAdditional: propsValue.shipping_streetAdditional,
      postalCode: propsValue.shipping_postalCode,
      email: propsValue.shipping_email,
      phone: propsValue.shipping_phone,
      city: propsValue.shipping_city,
      region: propsValue.shipping_region,
      country: propsValue.shipping_country,
    };

    const shipping = Object.fromEntries(
      Object.entries(shippingFields).filter(
        ([key, value]) => value !== undefined && value !== null && value !== ''
      )
    );

    if (Object.keys(shipping).length > 0) {
      paymentData.shipping = shipping;
    }
    if (
      propsValue.recurring_description ||
      propsValue.recurring_interval ||
      (propsValue.recurring_amount_currency &&
        propsValue.recurring_amount_value) ||
      propsValue.recurring_times ||
      propsValue.recurring_startDate
    ) {
      const recurringData: any = {};

      if (propsValue.recurring_description)
        recurringData.description = propsValue.recurring_description;
      if (propsValue.recurring_interval)
        recurringData.interval = propsValue.recurring_interval;
      if (
        propsValue.recurring_amount_currency &&
        propsValue.recurring_amount_value
      ) {
        recurringData.amount = {
          currency: propsValue.recurring_amount_currency,
          value: propsValue.recurring_amount_value,
        };
      }
      if (propsValue.recurring_times)
        recurringData.times = propsValue.recurring_times;
      if (propsValue.recurring_startDate)
        recurringData.startDate = propsValue.recurring_startDate;

      paymentData.recurring = recurringData;
    }

    if (propsValue.captureMode) {
      paymentData.captureMode = propsValue.captureMode;
    }
    if (propsValue.captureDelay) {
      paymentData.captureDelay = propsValue.captureDelay;
    }

    if (
      propsValue.applicationFee_amount_currency &&
      propsValue.applicationFee_amount_value &&
      propsValue.applicationFee_description
    ) {
      paymentData.applicationFee = {
        amount: {
          currency: propsValue.applicationFee_amount_currency,
          value: propsValue.applicationFee_amount_value,
        },
        description: propsValue.applicationFee_description,
      };
    }

    if (propsValue.routing && propsValue.routing.length > 0) {
      paymentData.routing = propsValue.routing.map((route: any) => {
        const routeData: any = {
          amount: {
            currency: route.amount_currency,
            value: route.amount_value,
          },
          destination: {
            organizationId: route.destination_organizationId,
          },
        };

        if (route.releaseDate) {
          routeData.releaseDate = route.releaseDate;
        }

        return routeData;
      });
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
    if (propsValue.dueDate) {
      paymentData.dueDate = propsValue.dueDate;
    }
    if (propsValue.profileId) {
      paymentData.profileId = propsValue.profileId;
    }
    if (propsValue.issuer) {
      paymentData.issuer = propsValue.issuer;
    }

    if (propsValue.sequenceType === 'recurring') {
      if (!propsValue.customerId) {
        throw new Error('customerId is required for recurring payments');
      }
      if (!propsValue.mandateId) {
        throw new Error('mandateId is required for recurring payments');
      }
    }

    if (propsValue.sequenceType === 'first' && !propsValue.customerId) {
      console.warn(
        'customerId recommended for first recurring payments to link the mandate'
      );
    }

    if (
      (propsValue.applicationFee_amount_currency ||
        propsValue.applicationFee_amount_value) &&
      !propsValue.applicationFee_description
    ) {
      throw new Error(
        'applicationFee_description is required when setting an application fee'
      );
    }

    if (!propsValue.redirectUrl && isRecurringPayment) {
      console.info('redirectUrl omitted for recurring payment');
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
