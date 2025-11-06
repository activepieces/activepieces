import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mollieCommon } from '../common';
import { mollieAuth } from '../../index';

export const mollieCreatePaymentLink = createAction({
  auth: mollieAuth,
  name: 'create_payment_link',
  displayName: 'Create Payment Link',
  description:
    'Generate a new payment link targeting a customer, product, or specific amount',
  props: {
    description: Property.ShortText({
      displayName: 'Description',
      description:
        'A short description of the payment link (max 255 characters)',
      required: true,
    }),

    includeAmount: Property.Checkbox({
      displayName: 'Include Fixed Amount',
      description:
        'Whether to include a fixed amount or let customer enter amount',
      required: false,
      defaultValue: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'A three-character ISO 4217 currency code (e.g. EUR, USD)',
      required: false,
      defaultValue: 'EUR',
    }),
    amount: Property.ShortText({
      displayName: 'Amount',
      description: 'The amount to charge (e.g. "10.00")',
      required: false,
    }),

    includeMinimumAmount: Property.Checkbox({
      displayName: 'Include Minimum Amount',
      description:
        'Whether to set a minimum amount (only when no fixed amount)',
      required: false,
      defaultValue: false,
    }),
    minimumAmountCurrency: Property.ShortText({
      displayName: 'Minimum Amount Currency',
      description: 'Currency for minimum amount',
      required: false,
      defaultValue: 'EUR',
    }),
    minimumAmount: Property.ShortText({
      displayName: 'Minimum Amount',
      description: 'The minimum amount (e.g. "5.00")',
      required: false,
    }),

    redirectUrl: Property.LongText({
      displayName: 'Redirect URL',
      description: 'URL to redirect customer after payment completion',
      required: false,
    }),

    webhookUrl: Property.LongText({
      displayName: 'Webhook URL',
      description: 'URL for payment status updates',
      required: false,
    }),

    includeLines: Property.Checkbox({
      displayName: 'Include Order Lines',
      description: 'Whether to include detailed order line items',
      required: false,
      defaultValue: false,
    }),
    lines: Property.Array({
      displayName: 'Order Lines',
      description: 'Order line items (required for certain payment methods)',
      required: false,
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
        description: Property.ShortText({
          displayName: 'Description',
          description: 'A description of the line item',
          required: true,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'The number of items',
          required: true,
        }),
        quantityUnit: Property.ShortText({
          displayName: 'Quantity Unit',
          description: 'The unit for the quantity (e.g. pcs, kg, cm)',
          required: false,
        }),
        unitPriceCurrency: Property.ShortText({
          displayName: 'Unit Price Currency',
          description: 'Currency for unit price',
          required: true,
          defaultValue: 'EUR',
        }),
        unitPriceValue: Property.ShortText({
          displayName: 'Unit Price Value',
          description: 'The price of a single item including VAT',
          required: true,
        }),
        totalAmountCurrency: Property.ShortText({
          displayName: 'Total Amount Currency',
          description: 'Currency for total amount',
          required: true,
          defaultValue: 'EUR',
        }),
        totalAmountValue: Property.ShortText({
          displayName: 'Total Amount Value',
          description: 'The total amount including VAT and discounts',
          required: true,
        }),
        vatRate: Property.ShortText({
          displayName: 'VAT Rate',
          description: 'VAT rate (e.g. "21.00" for 21%)',
          required: false,
        }),
        vatAmountCurrency: Property.ShortText({
          displayName: 'VAT Amount Currency',
          description: 'Currency for VAT amount',
          required: false,
        }),
        vatAmountValue: Property.ShortText({
          displayName: 'VAT Amount Value',
          description: 'The amount of VAT on the line',
          required: false,
        }),
        sku: Property.ShortText({
          displayName: 'SKU',
          description: 'The SKU, EAN, ISBN or UPC of the product',
          required: false,
        }),
        discountAmountCurrency: Property.ShortText({
          displayName: 'Discount Amount Currency',
          description: 'Currency for discount amount',
          required: false,
        }),
        discountAmountValue: Property.ShortText({
          displayName: 'Discount Amount Value',
          description: 'Line-specific discounts as positive amount',
          required: false,
        }),
        imageUrl: Property.LongText({
          displayName: 'Image URL',
          description: 'Link to product image',
          required: false,
        }),
        productUrl: Property.LongText({
          displayName: 'Product URL',
          description: 'Link to product page',
          required: false,
        }),
      },
    }),

    includeBillingAddress: Property.Checkbox({
      displayName: 'Include Billing Address',
      description: 'Whether to include billing address details',
      required: false,
      defaultValue: false,
    }),
    billingTitle: Property.ShortText({
      displayName: 'Billing Title',
      description: 'Title (e.g. Mr., Mrs.)',
      required: false,
    }),
    billingGivenName: Property.ShortText({
      displayName: 'Billing Given Name',
      description: 'First name',
      required: false,
    }),
    billingFamilyName: Property.ShortText({
      displayName: 'Billing Family Name',
      description: 'Last name',
      required: false,
    }),
    billingOrganizationName: Property.ShortText({
      displayName: 'Billing Organization',
      description: 'Organization name',
      required: false,
    }),
    billingStreetAndNumber: Property.ShortText({
      displayName: 'Billing Street and Number',
      description: 'Street address with number',
      required: false,
    }),
    billingStreetAdditional: Property.ShortText({
      displayName: 'Billing Street Additional',
      description: 'Additional address details',
      required: false,
    }),
    billingPostalCode: Property.ShortText({
      displayName: 'Billing Postal Code',
      description: 'Postal code',
      required: false,
    }),
    billingEmail: Property.ShortText({
      displayName: 'Billing Email',
      description: 'Email address',
      required: false,
    }),
    billingPhone: Property.ShortText({
      displayName: 'Billing Phone',
      description: 'Phone in E.164 format',
      required: false,
    }),
    billingCity: Property.ShortText({
      displayName: 'Billing City',
      description: 'City name',
      required: false,
    }),
    billingRegion: Property.ShortText({
      displayName: 'Billing Region',
      description: 'State or region',
      required: false,
    }),
    billingCountry: Property.ShortText({
      displayName: 'Billing Country',
      description: 'ISO 3166-1 alpha-2 country code',
      required: false,
    }),

    includeShippingAddress: Property.Checkbox({
      displayName: 'Include Shipping Address',
      description: 'Whether to include shipping address details',
      required: false,
      defaultValue: false,
    }),
    shippingTitle: Property.ShortText({
      displayName: 'Shipping Title',
      description: 'Title (e.g. Mr., Mrs.)',
      required: false,
    }),
    shippingGivenName: Property.ShortText({
      displayName: 'Shipping Given Name',
      description: 'First name',
      required: false,
    }),
    shippingFamilyName: Property.ShortText({
      displayName: 'Shipping Family Name',
      description: 'Last name',
      required: false,
    }),
    shippingOrganizationName: Property.ShortText({
      displayName: 'Shipping Organization',
      description: 'Organization name',
      required: false,
    }),
    shippingStreetAndNumber: Property.ShortText({
      displayName: 'Shipping Street and Number',
      description: 'Street address with number',
      required: false,
    }),
    shippingStreetAdditional: Property.ShortText({
      displayName: 'Shipping Street Additional',
      description: 'Additional address details',
      required: false,
    }),
    shippingPostalCode: Property.ShortText({
      displayName: 'Shipping Postal Code',
      description: 'Postal code',
      required: false,
    }),
    shippingEmail: Property.ShortText({
      displayName: 'Shipping Email',
      description: 'Email address',
      required: false,
    }),
    shippingPhone: Property.ShortText({
      displayName: 'Shipping Phone',
      description: 'Phone in E.164 format',
      required: false,
    }),
    shippingCity: Property.ShortText({
      displayName: 'Shipping City',
      description: 'City name',
      required: false,
    }),
    shippingRegion: Property.ShortText({
      displayName: 'Shipping Region',
      description: 'State or region',
      required: false,
    }),
    shippingCountry: Property.ShortText({
      displayName: 'Shipping Country',
      description: 'ISO 3166-1 alpha-2 country code',
      required: false,
    }),

    reusable: Property.Checkbox({
      displayName: 'Reusable',
      description: 'Allow multiple payments using the same link',
      required: false,
      defaultValue: false,
    }),

    expiresAt: Property.ShortText({
      displayName: 'Expires At',
      description: 'Expiry date in ISO 8601 format (e.g. 2024-12-31T23:59:59Z)',
      required: false,
    }),

    allowedMethods: Property.MultiSelectDropdown({
      displayName: 'Allowed Payment Methods',
      description:
        'Payment methods allowed for this link (empty = all enabled methods)',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Apple Pay', value: 'applepay' },
            { label: 'Bancomat Pay', value: 'bancomatpay' },
            { label: 'Bancontact', value: 'bancontact' },
            { label: 'Bank Transfer', value: 'banktransfer' },
            { label: 'Belfius', value: 'belfius' },
            { label: 'BLIK', value: 'blik' },
            { label: 'Credit Card', value: 'creditcard' },
            { label: 'EPS', value: 'eps' },
            { label: 'Gift Card', value: 'giftcard' },
            { label: 'iDEAL', value: 'ideal' },
            { label: 'KBC', value: 'kbc' },
            { label: 'MyBank', value: 'mybank' },
            { label: 'Pay by Bank', value: 'paybybank' },
            { label: 'PayPal', value: 'paypal' },
            { label: 'Paysafecard', value: 'paysafecard' },
            { label: 'Point of Sale', value: 'pointofsale' },
            { label: 'Przelewy24', value: 'przelewy24' },
            { label: 'Satispay', value: 'satispay' },
            { label: 'Trustly', value: 'trustly' },
            { label: 'Twint', value: 'twint' },
            { label: 'in3', value: 'in3' },
            { label: 'Riverty', value: 'riverty' },
            { label: 'Klarna', value: 'klarna' },
            { label: 'Billie', value: 'billie' },
          ],
        };
      },
    }),

    sequenceType: Property.StaticDropdown({
      displayName: 'Sequence Type',
      description: 'Type of payment sequence',
      required: false,
      defaultValue: 'oneoff',
      options: {
        options: [
          { label: 'One-off Payment', value: 'oneoff' },
          { label: 'First Payment (establishes mandate)', value: 'first' },
        ],
      },
    }),

    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Customer ID (only relevant for first sequence type)',
      required: false,
    }),

    testmode: Property.Checkbox({
      displayName: 'Test Mode',
      description: 'Whether to create the payment link in test mode',
      required: false,
      defaultValue: false,
    }),
  },

  async run({ auth, propsValue }) {
    const apiKey = auth as string;

    const paymentLinkData: Record<string, unknown> = {
      description: propsValue.description,
    };

    if (propsValue.includeAmount && propsValue.currency && propsValue.amount) {
      paymentLinkData['amount'] = {
        currency: propsValue.currency,
        value: propsValue.amount,
      };
    }

    if (
      propsValue.includeMinimumAmount &&
      !propsValue.includeAmount &&
      propsValue.minimumAmountCurrency &&
      propsValue.minimumAmount
    ) {
      paymentLinkData['minimumAmount'] = {
        currency: propsValue.minimumAmountCurrency,
        value: propsValue.minimumAmount,
      };
    }

    if (propsValue.redirectUrl) {
      paymentLinkData['redirectUrl'] = propsValue.redirectUrl;
    }
    if (propsValue.webhookUrl) {
      paymentLinkData['webhookUrl'] = propsValue.webhookUrl;
    }

    if (
      propsValue.includeLines &&
      propsValue.lines &&
      Array.isArray(propsValue.lines)
    ) {
      const lines = (propsValue.lines as unknown[]).map((line: unknown) => {
        const lineData = line as Record<string, unknown>;
        const orderLine: Record<string, unknown> = {
          type: lineData['type'] || 'physical',
          description: lineData['description'],
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

        if (lineData['quantityUnit'])
          orderLine['quantityUnit'] = lineData['quantityUnit'];
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

        return orderLine;
      });

      paymentLinkData['lines'] = lines;
    }

    if (propsValue.includeBillingAddress) {
      const billingAddress: Record<string, unknown> = {};
      if (propsValue.billingTitle)
        billingAddress['title'] = propsValue.billingTitle;
      if (propsValue.billingGivenName)
        billingAddress['givenName'] = propsValue.billingGivenName;
      if (propsValue.billingFamilyName)
        billingAddress['familyName'] = propsValue.billingFamilyName;
      if (propsValue.billingOrganizationName)
        billingAddress['organizationName'] = propsValue.billingOrganizationName;
      if (propsValue.billingStreetAndNumber)
        billingAddress['streetAndNumber'] = propsValue.billingStreetAndNumber;
      if (propsValue.billingStreetAdditional)
        billingAddress['streetAdditional'] = propsValue.billingStreetAdditional;
      if (propsValue.billingPostalCode)
        billingAddress['postalCode'] = propsValue.billingPostalCode;
      if (propsValue.billingEmail)
        billingAddress['email'] = propsValue.billingEmail;
      if (propsValue.billingPhone)
        billingAddress['phone'] = propsValue.billingPhone;
      if (propsValue.billingCity)
        billingAddress['city'] = propsValue.billingCity;
      if (propsValue.billingRegion)
        billingAddress['region'] = propsValue.billingRegion;
      if (propsValue.billingCountry)
        billingAddress['country'] = propsValue.billingCountry;

      if (Object.keys(billingAddress).length > 0) {
        paymentLinkData['billingAddress'] = billingAddress;
      }
    }

    if (propsValue.includeShippingAddress) {
      const shippingAddress: Record<string, unknown> = {};
      if (propsValue.shippingTitle)
        shippingAddress['title'] = propsValue.shippingTitle;
      if (propsValue.shippingGivenName)
        shippingAddress['givenName'] = propsValue.shippingGivenName;
      if (propsValue.shippingFamilyName)
        shippingAddress['familyName'] = propsValue.shippingFamilyName;
      if (propsValue.shippingOrganizationName)
        shippingAddress['organizationName'] =
          propsValue.shippingOrganizationName;
      if (propsValue.shippingStreetAndNumber)
        shippingAddress['streetAndNumber'] = propsValue.shippingStreetAndNumber;
      if (propsValue.shippingStreetAdditional)
        shippingAddress['streetAdditional'] =
          propsValue.shippingStreetAdditional;
      if (propsValue.shippingPostalCode)
        shippingAddress['postalCode'] = propsValue.shippingPostalCode;
      if (propsValue.shippingEmail)
        shippingAddress['email'] = propsValue.shippingEmail;
      if (propsValue.shippingPhone)
        shippingAddress['phone'] = propsValue.shippingPhone;
      if (propsValue.shippingCity)
        shippingAddress['city'] = propsValue.shippingCity;
      if (propsValue.shippingRegion)
        shippingAddress['region'] = propsValue.shippingRegion;
      if (propsValue.shippingCountry)
        shippingAddress['country'] = propsValue.shippingCountry;

      if (Object.keys(shippingAddress).length > 0) {
        paymentLinkData['shippingAddress'] = shippingAddress;
      }
    }

    if (propsValue.reusable !== undefined) {
      paymentLinkData['reusable'] = propsValue.reusable;
    }
    if (propsValue.expiresAt) {
      paymentLinkData['expiresAt'] = propsValue.expiresAt;
    }
    if (
      propsValue.allowedMethods &&
      Array.isArray(propsValue.allowedMethods) &&
      propsValue.allowedMethods.length > 0
    ) {
      paymentLinkData['allowedMethods'] = propsValue.allowedMethods;
    }
    if (propsValue.sequenceType) {
      paymentLinkData['sequenceType'] = propsValue.sequenceType;
    }
    if (propsValue.customerId) {
      paymentLinkData['customerId'] = propsValue.customerId;
    }

    const response = await mollieCommon.makeRequest(
      apiKey,
      HttpMethod.POST,
      '/payment-links',
      paymentLinkData
    );

    return response;
  },
});
