import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { MollieAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { currencyDropdown, localeDropdown } from '../common/props';

export const createOrder = createAction({
  auth: MollieAuth,
  name: 'createOrder',
  displayName: 'Create Order',
  description:
    'Create an order in Mollie. Note: The Payments API is preferred over the Orders API for most use cases.',
  props: {
    amount_currency: currencyDropdown('Amount Currency'),
    amount_value: Property.ShortText({
      displayName: 'Value',
      description: 'Amount in the smallest currency unit (e.g. cents for EUR)',
      required: true,
    }),

    orderNumber: Property.ShortText({
      displayName: 'Order Number',
      description: 'Your unique order number/reference',
      required: true,
    }),

    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Name of the product',
      required: true,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'Quantity of the product',
      required: true,
    }),
    unitPrice_currency: currencyDropdown('Unit Price Currency'),
    unitPrice_value: Property.ShortText({
      displayName: 'Unit Price Value',
      required: true,
    }),
    totalAmount_currency: currencyDropdown('Total Amount Currency'),
    totalAmount_value: Property.ShortText({
      displayName: 'Total Amount Value',
      required: true,
    }),
    vatRate: Property.ShortText({
      displayName: 'VAT Rate',
      description: 'VAT rate as percentage (e.g. 21.00)',
      required: true,
    }),
    vatAmount_currency: currencyDropdown('VAT Amount Currency'),
    vatAmount_value: Property.ShortText({
      displayName: 'VAT Amount Value',
      required: true,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Product SKU or identifier',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Line Type',
      description: 'Type of order line',
      required: false,
      options: {
        options: [
          { label: 'Physical', value: 'physical' },
          { label: 'Digital', value: 'digital' },
          { label: 'Shipping Fee', value: 'shipping_fee' },
          { label: 'Store Credit', value: 'store_credit' },
          { label: 'Gift Card', value: 'gift_card' },
          { label: 'Surcharge', value: 'surcharge' },
          { label: 'Discount', value: 'discount' },
        ],
      },
    }),
    category: Property.StaticDropdown({
      displayName: 'Product Category',
      description: 'Product category for Klarna and other payment methods',
      required: false,
      options: {
        options: [
          { label: 'Meal', value: 'meal' },
          { label: 'Eco', value: 'eco' },
          { label: 'Gift', value: 'gift' },
        ],
      },
    }),
    productUrl: Property.ShortText({
      displayName: 'Product URL',
      description: 'URL to the product page',
      required: false,
    }),
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'URL to product image',
      required: false,
    }),

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
    redirectUrl: Property.ShortText({
      displayName: 'Redirect URL',
      description: 'URL to redirect customer after payment',
      required: true,
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'URL for order status webhooks',
      required: false,
    }),
    locale: localeDropdown,
    method: Property.StaticDropdown({
      displayName: 'Payment Method',
      description: 'Force a specific payment method (optional)',
      required: false,
      options: {
        options: [
          { label: 'Klarna Pay Later', value: 'klarnapaylater' },
          { label: 'Klarna Pay Now', value: 'klarnapaynow' },
          { label: 'Klarna Slice It', value: 'klarnasliceit' },
          { label: 'Credit Card', value: 'creditcard' },
          { label: 'PayPal', value: 'paypal' },
          { label: 'Apple Pay', value: 'applepay' },
          { label: 'Billie', value: 'billie' },
          { label: 'in3', value: 'in3' },
          { label: 'Riverty', value: 'riverty' },
        ],
      },
    }),
    orderMetadata: Property.Object({
      displayName: 'Order Metadata',
      description: 'Custom metadata for the order',
      required: false,
    }),
    consumerDateOfBirth: Property.ShortText({
      displayName: 'Consumer Date of Birth',
      description:
        'Consumer date of birth in YYYY-MM-DD format (required for some payment methods)',
      required: false,
    }),
    shopperCountryMustMatchBillingCountry: Property.Checkbox({
      displayName: 'Shopper Country Must Match Billing',
      description: 'Require shopper country to match billing country',
      required: false,
    }),
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Mollie customer ID for recurring payments',
      required: false,
    }),
    mandateId: Property.ShortText({
      displayName: 'Mandate ID',
      description: 'Mollie mandate ID for recurring payments',
      required: false,
    }),
    sequenceType: Property.StaticDropdown({
      displayName: 'Sequence Type',
      description: 'Type of recurring payment',
      required: false,
      options: {
        options: [
          { label: 'One-off payment', value: 'oneoff' },
          { label: 'First recurring payment', value: 'first' },
          { label: 'Recurring payment', value: 'recurring' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    // Build the order line
    const orderLine: any = {
      name: propsValue.name,
      quantity: propsValue.quantity,
      unitPrice: {
        currency: propsValue.unitPrice_currency,
        value: propsValue.unitPrice_value,
      },
      totalAmount: {
        currency: propsValue.totalAmount_currency,
        value: propsValue.totalAmount_value,
      },
      vatRate: propsValue.vatRate,
      vatAmount: {
        currency: propsValue.vatAmount_currency,
        value: propsValue.vatAmount_value,
      },
    };

    if (propsValue.sku) orderLine.sku = propsValue.sku;
    if (propsValue.type) orderLine.type = propsValue.type;
    if (propsValue.category) orderLine.category = propsValue.category;
    if (propsValue.productUrl) orderLine.productUrl = propsValue.productUrl;
    if (propsValue.imageUrl) orderLine.imageUrl = propsValue.imageUrl;

    const billingAddress: any = {
      givenName: propsValue.billing_givenName,
      familyName: propsValue.billing_familyName,
      email: propsValue.billing_email,
      streetAndNumber: propsValue.billing_streetAndNumber,
      postalCode: propsValue.billing_postalCode,
      city: propsValue.billing_city,
      country: propsValue.billing_country,
    };
    if (propsValue.billing_organizationName)
      billingAddress.organizationName = propsValue.billing_organizationName;
    if (propsValue.billing_title)
      billingAddress.title = propsValue.billing_title;
    if (propsValue.billing_phone)
      billingAddress.phone = propsValue.billing_phone;
    if (propsValue.billing_streetAdditional)
      billingAddress.streetAdditional = propsValue.billing_streetAdditional;
    if (propsValue.billing_region)
      billingAddress.region = propsValue.billing_region;

    const orderData: any = {
      amount: {
        currency: propsValue.amount_currency,
        value: propsValue.amount_value,
      },
      orderNumber: propsValue.orderNumber,
      lines: [orderLine],
      billingAddress: billingAddress,
      redirectUrl: propsValue.redirectUrl,
    };

    const hasShippingAddress =
      propsValue.shippingAddress_givenName ||
      propsValue.shippingAddress_familyName ||
      propsValue.shippingAddress_streetAndNumber ||
      propsValue.shippingAddress_postalCode ||
      propsValue.shippingAddress_city ||
      propsValue.shippingAddress_country;

    if (hasShippingAddress) {
      const shippingAddress: any = {};
      if (propsValue.shippingAddress_organizationName)
        shippingAddress.organizationName =
          propsValue.shippingAddress_organizationName;
      if (propsValue.shippingAddress_title)
        shippingAddress.title = propsValue.shippingAddress_title;
      if (propsValue.shippingAddress_givenName)
        shippingAddress.givenName = propsValue.shippingAddress_givenName;
      if (propsValue.shippingAddress_familyName)
        shippingAddress.familyName = propsValue.shippingAddress_familyName;
      if (propsValue.shippingAddress_email)
        shippingAddress.email = propsValue.shippingAddress_email;
      if (propsValue.shippingAddress_phone)
        shippingAddress.phone = propsValue.shippingAddress_phone;
      if (propsValue.shippingAddress_streetAndNumber)
        shippingAddress.streetAndNumber =
          propsValue.shippingAddress_streetAndNumber;
      if (propsValue.shippingAddress_streetAdditional)
        shippingAddress.streetAdditional =
          propsValue.shippingAddress_streetAdditional;
      if (propsValue.shippingAddress_postalCode)
        shippingAddress.postalCode = propsValue.shippingAddress_postalCode;
      if (propsValue.shippingAddress_city)
        shippingAddress.city = propsValue.shippingAddress_city;
      if (propsValue.shippingAddress_region)
        shippingAddress.region = propsValue.shippingAddress_region;
      if (propsValue.shippingAddress_country)
        shippingAddress.country = propsValue.shippingAddress_country;

      orderData.shippingAddress = shippingAddress;
    }

    if (propsValue.webhookUrl) {
      orderData.webhookUrl = propsValue.webhookUrl;
    }
    if (propsValue.locale) {
      orderData.locale = propsValue.locale;
    }
    if (propsValue.method) {
      orderData.method = propsValue.method;
    }
    if (propsValue.orderMetadata) {
      orderData.metadata = propsValue.orderMetadata;
    }
    if (propsValue.consumerDateOfBirth) {
      orderData.consumerDateOfBirth = propsValue.consumerDateOfBirth;
    }
    if (propsValue.shopperCountryMustMatchBillingCountry !== undefined) {
      orderData.shopperCountryMustMatchBillingCountry =
        propsValue.shopperCountryMustMatchBillingCountry;
    }

    if (
      propsValue.customerId ||
      propsValue.mandateId ||
      propsValue.sequenceType
    ) {
      const payment: any = {};
      if (propsValue.customerId) payment.customerId = propsValue.customerId;
      if (propsValue.mandateId) payment.mandateId = propsValue.mandateId;
      if (propsValue.sequenceType)
        payment.sequenceType = propsValue.sequenceType;
      orderData.payment = payment;
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/orders',
      orderData
    );

    return response;
  },
});
