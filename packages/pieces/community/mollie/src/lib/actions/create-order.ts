import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mollieCommon, MollieOrder } from '../common';
import { mollieAuth } from '../../index';

export const mollieCreateOrder = createAction({
  auth: mollieAuth,
  name: 'create_order',
  displayName: 'Create Order',
  description:
    '⚠️ We no longer recommend using the Orders API. Please refer to the Payments API instead.\n\nCreate a new order in Mollie',
  props: {
    orderNumber: Property.ShortText({
      displayName: 'Order Number',
      description:
        'The order number for this order. We recommend each order number to be unique.',
      required: true,
    }),

    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'A three-character ISO 4217 currency code (e.g. EUR, USD)',
      required: true,
      defaultValue: 'EUR',
    }),
    amount: Property.ShortText({
      displayName: 'Total Amount',
      description: 'The total amount to charge (e.g. "10.00")',
      required: true,
    }),

    lines: Property.Array({
      displayName: 'Order Lines',
      description: 'The order lines for the order',
      required: true,
      properties: {
        type: Property.StaticDropdown({
          displayName: 'Type',
          description: 'The type of product purchased',
          required: false,
          defaultValue: 'physical',
          options: {
            options: [
              { label: 'Physical', value: 'physical' },
              { label: 'Digital', value: 'digital' },
              { label: 'Shipping Fee', value: 'shipping_fee' },
              { label: 'Discount', value: 'discount' },
              { label: 'Store Credit', value: 'store_credit' },
              { label: 'Gift Card', value: 'gift_card' },
              { label: 'Surcharge', value: 'surcharge' },
            ],
          },
        }),
        name: Property.ShortText({
          displayName: 'Name',
          description: 'A description of the line item',
          required: true,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'The number of items',
          required: true,
        }),
        unitPriceCurrency: Property.ShortText({
          displayName: 'Unit Price Currency',
          description: 'Currency for unit price (should match order currency)',
          required: true,
          defaultValue: 'EUR',
        }),
        unitPriceValue: Property.ShortText({
          displayName: 'Unit Price Value',
          description:
            'The price of a single item including VAT (e.g. "10.00")',
          required: true,
        }),
        totalAmountCurrency: Property.ShortText({
          displayName: 'Total Amount Currency',
          description:
            'Currency for total amount (should match order currency)',
          required: true,
          defaultValue: 'EUR',
        }),
        totalAmountValue: Property.ShortText({
          displayName: 'Total Amount Value',
          description:
            'The total amount of the line including VAT and discounts',
          required: true,
        }),
        vatRate: Property.ShortText({
          displayName: 'VAT Rate',
          description:
            'The VAT rate applied to the line (e.g. "21.00" for 21%)',
          required: false,
        }),
        vatAmountCurrency: Property.ShortText({
          displayName: 'VAT Amount Currency',
          description: 'Currency for VAT amount',
          required: false,
        }),
        vatAmountValue: Property.ShortText({
          displayName: 'VAT Amount Value',
          description: 'The amount of value-added tax on the line',
          required: false,
        }),
        sku: Property.ShortText({
          displayName: 'SKU',
          description: 'The SKU, EAN, ISBN or UPC of the product sold',
          required: false,
        }),
        discountAmountCurrency: Property.ShortText({
          displayName: 'Discount Amount Currency',
          description: 'Currency for discount amount',
          required: false,
        }),
        discountAmountValue: Property.ShortText({
          displayName: 'Discount Amount Value',
          description: 'Any line-specific discounts, as a positive amount',
          required: false,
        }),
        imageUrl: Property.LongText({
          displayName: 'Image URL',
          description: 'A link pointing to an image of the product sold',
          required: false,
        }),
        productUrl: Property.LongText({
          displayName: 'Product URL',
          description: 'A link pointing to the product page in your web shop',
          required: false,
        }),
        category: Property.StaticDropdown({
          displayName: 'Category',
          description: 'The voucher category (for voucher-eligible items)',
          required: false,
          options: {
            options: [
              { label: 'Meal', value: 'meal' },
              { label: 'Eco', value: 'eco' },
              { label: 'Gift', value: 'gift' },
              { label: 'Sport & Culture', value: 'sport_culture' },
            ],
          },
        }),
      },
    }),

    billingTitle: Property.ShortText({
      displayName: 'Billing Title',
      description: 'The title of the person (e.g. Mr., Mrs.)',
      required: false,
    }),
    billingGivenName: Property.ShortText({
      displayName: 'Billing Given Name',
      description: 'The given name (first name) of the person',
      required: true,
    }),
    billingFamilyName: Property.ShortText({
      displayName: 'Billing Family Name',
      description: 'The family name (surname) of the person',
      required: true,
    }),
    billingOrganizationName: Property.ShortText({
      displayName: 'Billing Organization Name',
      description: 'The name of the organization',
      required: false,
    }),
    billingStreetAndNumber: Property.ShortText({
      displayName: 'Billing Street and Number',
      description: 'A street and street number',
      required: true,
    }),
    billingStreetAdditional: Property.ShortText({
      displayName: 'Billing Street Additional',
      description: 'Any additional addressing details',
      required: false,
    }),
    billingPostalCode: Property.ShortText({
      displayName: 'Billing Postal Code',
      description: 'A postal code',
      required: true,
    }),
    billingEmail: Property.ShortText({
      displayName: 'Billing Email',
      description: 'Email address',
      required: true,
    }),
    billingPhone: Property.ShortText({
      displayName: 'Billing Phone',
      description: 'Phone number in E.164 format',
      required: false,
    }),
    billingCity: Property.ShortText({
      displayName: 'Billing City',
      description: 'City name',
      required: true,
    }),
    billingRegion: Property.ShortText({
      displayName: 'Billing Region',
      description: 'Region or state',
      required: false,
    }),
    billingCountry: Property.ShortText({
      displayName: 'Billing Country',
      description: 'A country code in ISO 3166-1 alpha-2 format',
      required: true,
    }),

    includeShippingAddress: Property.Checkbox({
      displayName: 'Include Shipping Address',
      description: 'Whether to include a separate shipping address',
      required: false,
      defaultValue: false,
    }),
    shippingTitle: Property.ShortText({
      displayName: 'Shipping Title',
      description: 'The title of the person (e.g. Mr., Mrs.)',
      required: false,
    }),
    shippingGivenName: Property.ShortText({
      displayName: 'Shipping Given Name',
      description: 'The given name (first name) of the person',
      required: false,
    }),
    shippingFamilyName: Property.ShortText({
      displayName: 'Shipping Family Name',
      description: 'The family name (surname) of the person',
      required: false,
    }),
    shippingOrganizationName: Property.ShortText({
      displayName: 'Shipping Organization Name',
      description: 'The name of the organization',
      required: false,
    }),
    shippingStreetAndNumber: Property.ShortText({
      displayName: 'Shipping Street and Number',
      description: 'A street and street number',
      required: false,
    }),
    shippingStreetAdditional: Property.ShortText({
      displayName: 'Shipping Street Additional',
      description: 'Any additional addressing details',
      required: false,
    }),
    shippingPostalCode: Property.ShortText({
      displayName: 'Shipping Postal Code',
      description: 'A postal code',
      required: false,
    }),
    shippingEmail: Property.ShortText({
      displayName: 'Shipping Email',
      description: 'Email address',
      required: false,
    }),
    shippingPhone: Property.ShortText({
      displayName: 'Shipping Phone',
      description: 'Phone number in E.164 format',
      required: false,
    }),
    shippingCity: Property.ShortText({
      displayName: 'Shipping City',
      description: 'City name',
      required: false,
    }),
    shippingRegion: Property.ShortText({
      displayName: 'Shipping Region',
      description: 'Region or state',
      required: false,
    }),
    shippingCountry: Property.ShortText({
      displayName: 'Shipping Country',
      description: 'A country code in ISO 3166-1 alpha-2 format',
      required: false,
    }),

    locale: Property.StaticDropdown({
      displayName: 'Locale',
      description: 'The language to be used in the hosted payment pages',
      required: true,
      defaultValue: 'en_US',
      options: {
        options: [
          { label: 'English (US)', value: 'en_US' },
          { label: 'English (GB)', value: 'en_GB' },
          { label: 'Dutch (NL)', value: 'nl_NL' },
          { label: 'Dutch (BE)', value: 'nl_BE' },
          { label: 'German (DE)', value: 'de_DE' },
          { label: 'German (AT)', value: 'de_AT' },
          { label: 'German (CH)', value: 'de_CH' },
          { label: 'French (FR)', value: 'fr_FR' },
          { label: 'French (BE)', value: 'fr_BE' },
          { label: 'Spanish (ES)', value: 'es_ES' },
          { label: 'Catalan (ES)', value: 'ca_ES' },
          { label: 'Portuguese (PT)', value: 'pt_PT' },
          { label: 'Italian (IT)', value: 'it_IT' },
          { label: 'Norwegian (NO)', value: 'nb_NO' },
          { label: 'Swedish (SE)', value: 'sv_SE' },
          { label: 'Finnish (FI)', value: 'fi_FI' },
          { label: 'Danish (DK)', value: 'da_DK' },
          { label: 'Icelandic (IS)', value: 'is_IS' },
          { label: 'Hungarian (HU)', value: 'hu_HU' },
          { label: 'Polish (PL)', value: 'pl_PL' },
          { label: 'Latvian (LV)', value: 'lv_LV' },
          { label: 'Lithuanian (LT)', value: 'lt_LT' },
        ],
      },
    }),
    redirectUrl: Property.LongText({
      displayName: 'Redirect URL',
      description:
        'The URL your customer will be redirected to after the payment process',
      required: false,
    }),
    cancelUrl: Property.LongText({
      displayName: 'Cancel URL',
      description:
        'The URL your customer will be redirected to when they cancel the payment',
      required: false,
    }),
    webhookUrl: Property.LongText({
      displayName: 'Webhook URL',
      description: 'The webhook URL where order status updates will be sent',
      required: false,
    }),
    method: Property.StaticDropdown({
      displayName: 'Payment Method',
      description: 'Specific payment method to use (optional)',
      required: false,
      options: {
        options: [
          { label: 'Apple Pay', value: 'applepay' },
          { label: 'Bancomat Pay', value: 'bancomatpay' },
          { label: 'Bancontact', value: 'bancontact' },
          { label: 'Bank Transfer', value: 'banktransfer' },
          { label: 'Belfius', value: 'belfius' },
          { label: 'Billie', value: 'billie' },
          { label: 'Credit Card', value: 'creditcard' },
          { label: 'Direct Debit', value: 'directdebit' },
          { label: 'EPS', value: 'eps' },
          { label: 'Gift Card', value: 'giftcard' },
          { label: 'iDEAL', value: 'ideal' },
          { label: 'in3', value: 'in3' },
          { label: 'KBC', value: 'kbc' },
          { label: 'Klarna', value: 'klarna' },
          { label: 'Klarna Pay Later', value: 'klarnapaylater' },
          { label: 'Klarna Pay Now', value: 'klarnapaynow' },
          { label: 'Klarna Slice It', value: 'klarnasliceit' },
          { label: 'MyBank', value: 'mybank' },
          { label: 'PayPal', value: 'paypal' },
          { label: 'Paysafecard', value: 'paysafecard' },
          { label: 'Przelewy24', value: 'przelewy24' },
          { label: 'Riverty', value: 'riverty' },
          { label: 'Satispay', value: 'satispay' },
          { label: 'Trustly', value: 'trustly' },
          { label: 'Twint', value: 'twint' },
          { label: 'Voucher', value: 'voucher' },
        ],
      },
    }),
    shopperCountryMustMatchBillingCountry: Property.Checkbox({
      displayName: 'Shopper Country Must Match Billing Country',
      description:
        'Restrict payment methods to those from the billing country only',
      required: false,
    }),
    expiresAt: Property.ShortText({
      displayName: 'Expires At',
      description: 'The date the order should expire in YYYY-MM-DD format',
      required: false,
    }),
    consumerDateOfBirth: Property.DateTime({
      displayName: 'Consumer Date of Birth',
      description: 'The date of birth of the consumer in YYYY-MM-DD format',
      required: false,
    }),
    testmode: Property.Checkbox({
      displayName: 'Test Mode',
      description: 'Whether to create the order in test mode',
      required: false,
      defaultValue: false,
    }),
  },

  async run({ auth, propsValue }) {
    const apiKey = auth as string;

    const billingAddress = {
      givenName: propsValue.billingGivenName,
      familyName: propsValue.billingFamilyName,
      streetAndNumber: propsValue.billingStreetAndNumber,
      postalCode: propsValue.billingPostalCode,
      email: propsValue.billingEmail,
      city: propsValue.billingCity,
      country: propsValue.billingCountry,
      ...(propsValue.billingTitle && { title: propsValue.billingTitle }),
      ...(propsValue.billingOrganizationName && {
        organizationName: propsValue.billingOrganizationName,
      }),
      ...(propsValue.billingStreetAdditional && {
        streetAdditional: propsValue.billingStreetAdditional,
      }),
      ...(propsValue.billingPhone && { phone: propsValue.billingPhone }),
      ...(propsValue.billingRegion && { region: propsValue.billingRegion }),
    };

    let shippingAddress;
    if (
      propsValue.includeShippingAddress &&
      propsValue.shippingGivenName &&
      propsValue.shippingFamilyName
    ) {
      shippingAddress = {
        givenName: propsValue.shippingGivenName,
        familyName: propsValue.shippingFamilyName,
        streetAndNumber: propsValue.shippingStreetAndNumber || '',
        postalCode: propsValue.shippingPostalCode || '',
        email: propsValue.shippingEmail || propsValue.billingEmail,
        city: propsValue.shippingCity || '',
        country: propsValue.shippingCountry || '',
        ...(propsValue.shippingTitle && { title: propsValue.shippingTitle }),
        ...(propsValue.shippingOrganizationName && {
          organizationName: propsValue.shippingOrganizationName,
        }),
        ...(propsValue.shippingStreetAdditional && {
          streetAdditional: propsValue.shippingStreetAdditional,
        }),
        ...(propsValue.shippingPhone && { phone: propsValue.shippingPhone }),
        ...(propsValue.shippingRegion && { region: propsValue.shippingRegion }),
      };
    }

    const lines = (propsValue.lines as unknown[]).map((line: unknown) => {
      const lineData = line as Record<string, unknown>;
      const orderLine: Record<string, unknown> = {
        type: lineData['type'] || 'physical',
        name: lineData['name'],
        quantity: lineData['quantity'],
        unitPrice: {
          currency: lineData['unitPriceCurrency'],
          value: lineData['unitPriceValue'],
        },
        totalAmount: {
          currency: lineData['totalAmountCurrency'],
          value: lineData['totalAmountValue'],
        },
      };

      if (lineData['vatRate']) orderLine['vatRate'] = lineData['vatRate'];
      if (lineData['vatAmountCurrency'] && lineData['vatAmountValue']) {
        orderLine['vatAmount'] = {
          currency: lineData['vatAmountCurrency'],
          value: lineData['vatAmountValue'],
        };
      }
      if (lineData['sku']) orderLine['sku'] = lineData['sku'];
      if (
        lineData['discountAmountCurrency'] &&
        lineData['discountAmountValue']
      ) {
        orderLine['discountAmount'] = {
          currency: lineData['discountAmountCurrency'],
          value: lineData['discountAmountValue'],
        };
      }
      if (lineData['imageUrl']) orderLine['imageUrl'] = lineData['imageUrl'];
      if (lineData['productUrl'])
        orderLine['productUrl'] = lineData['productUrl'];
      if (lineData['category']) orderLine['category'] = lineData['category'];

      return orderLine;
    });

    const orderData: Record<string, unknown> = {
      orderNumber: propsValue.orderNumber,
      amount: {
        currency: propsValue.currency,
        value: propsValue.amount,
      },
      lines,
      billingAddress,
      locale: propsValue.locale,
    };

    if (shippingAddress) {
      orderData['shippingAddress'] = shippingAddress;
    }
    if (propsValue.redirectUrl) {
      orderData['redirectUrl'] = propsValue.redirectUrl;
    }
    if (propsValue.cancelUrl) {
      orderData['cancelUrl'] = propsValue.cancelUrl;
    }
    if (propsValue.webhookUrl) {
      orderData['webhookUrl'] = propsValue.webhookUrl;
    }
    if (propsValue.method) {
      orderData['method'] = propsValue.method;
    }
    if (propsValue.shopperCountryMustMatchBillingCountry !== undefined) {
      orderData['shopperCountryMustMatchBillingCountry'] =
        propsValue.shopperCountryMustMatchBillingCountry;
    }
    if (propsValue.expiresAt) {
      orderData['expiresAt'] = propsValue.expiresAt;
    }
    if (propsValue.consumerDateOfBirth) {
      orderData['consumerDateOfBirth'] = propsValue.consumerDateOfBirth;
    }

    const response = await mollieCommon.makeRequest<MollieOrder>(
      apiKey,
      HttpMethod.POST,
      '/orders',
      orderData,
      propsValue.testmode
    );

    return response;
  },
});
