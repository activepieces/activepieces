import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { MollieAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import {
  currencyDropdown,
  localeDropdown,
  mandatesIdDropdown,
  paymentMethodDropdown,
  profileIdDropdown,
} from '../common/props';

interface MollieAddress {
  organizationName?: string;
  title?: string;
  givenName: string;
  familyName?: string;
  email?: string;
  phone?: string;
  streetAndNumber?: string;
  streetAdditional?: string;
  postalCode?: string;
  city?: string;
  region?: string;
  country?: string;
}

interface MollieAmount {
  currency: string;
  value: string;
}

interface MollieOrderLine {
  name: string;
  type?: string;
  quantity: number;
  quantityUnit?: string;
  unitPrice: MollieAmount;
  totalAmount: MollieAmount;
  discountAmount?: MollieAmount;
  vatRate?: string;
  vatAmount?: MollieAmount;
  sku?: string;
  categories?: string[];
  imageUrl?: string;
  productUrl?: string;
}

interface MolliePayment {
  mandateId?: string;
  sequenceType?: string;
}

interface MollieOrderData {
  amount: MollieAmount;
  orderNumber: string;
  billingAddress: MollieAddress;
  shippingAddress?: MollieAddress;
  redirectUrl?: string;
  cancelUrl?: string;
  webhookUrl?: string;
  locale?: string;
  allowedMethods?: string;
  metadata?: Record<string, unknown>;
  consumerDateOfBirth?: string;
  shopperCountryMustMatchBillingCountry?: boolean;
  lines?: MollieOrderLine[];
  payment?: MolliePayment;
  profileId?: string | Record<string, unknown>;
}

export const createOrder = createAction({
  auth: MollieAuth,
  name: 'createOrder',
  displayName: 'Create Order',
  description:
    'Create an order in Mollie with billing details, shipping information, and line items. An order automatically creates a payment for the customer to complete.',
  props: {
    amount_currency: currencyDropdown('Amount Currency'),
    amount_value: Property.ShortText({
      displayName: 'Amount Value',
      description:
        'Amount in the smallest currency unit (e.g. 1099 for €10.99)',
      required: true,
    }),

    orderNumber: Property.ShortText({
      displayName: 'Order Number',
      description:
        'Your unique order number/reference (e.g., "ORDER-2023-001")',
      required: true,
    }),
    redirectUrl: Property.ShortText({
      displayName: 'Redirect URL',
      description: 'URL to redirect customer after successful payment',
      required: false,
    }),
    cancelUrl: Property.ShortText({
      displayName: 'Cancel URL',
      description: 'URL to redirect customer if they cancel the payment',
      required: false,
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      description:
        'URL for order status webhooks (must be accessible from internet)',
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
      required: false,
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
      required: false,
    }),
    billing_streetAdditional: Property.ShortText({
      displayName: 'Additional Address',
      required: false,
    }),
    billing_postalCode: Property.ShortText({
      displayName: 'Postal Code',
      required: false,
    }),
    billing_city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    billing_region: Property.ShortText({
      displayName: 'Region',
      required: false,
    }),
    billing_country: Property.ShortText({
      displayName: 'Country',
      description: 'Two-letter ISO country code',
      required: false,
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
    profileId: profileIdDropdown,
    mandateId: mandatesIdDropdown,
    locale: localeDropdown,
    method: paymentMethodDropdown,
    orderMetadata: Property.Object({
      displayName: 'Order Metadata',
      description: 'Custom metadata for the order',
      required: false,
    }),
    shopperCountryMustMatchBillingCountry: Property.Checkbox({
      displayName: 'Shopper Country Must Match Billing',
      description: 'Require shopper country to match billing country',
      required: false,
    }),
    consumerDateOfBirth: Property.ShortText({
      displayName: 'Consumer Date of Birth',
      description:
        'Consumer date of birth in YYYY-MM-DD format (required for some payment methods)',
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
    lines: Property.Array({
      displayName: 'Lines',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Name',
          required: true,
        }),
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
          description: 'Internal description (not sent to Mollie API)',
          required: false,
        }),
        quantity: Property.Number({ displayName: 'Quantity', required: true }),
        quantityUnit: Property.ShortText({
          displayName: 'Quantity Unit',
          required: false,
        }),
        unitPrice_currency: currencyDropdown('Unit Price Currency', true),
        unitPrice_value: Property.ShortText({
          displayName: 'Unit Price (value)',
          description: 'String with 2 decimals (e.g. 89.00)',
          required: true,
        }),
        discountAmount_currency: currencyDropdown(
          'Discount Amount Currency',
          false
        ),
        discountAmount_value: Property.ShortText({
          displayName: 'Discount Amount (value)',
          description: 'Positive amount; optional',
          required: false,
        }),
        // totalAmount_currency: currencyDropdown('Total Amount Currency', false),
        // totalAmount_value: Property.ShortText({
        //   displayName: 'Total Amount (value)',
        //   description: '(unitPrice × quantity) - discountAmount',
        //   required: false,
        // }),
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
  },
  async run({ auth, propsValue }) {
    // Validate amount value format
    const amountValue = propsValue.amount_value;
    if (!/^\d+(\.\d{1,2})?$/.test(amountValue)) {
      throw new Error(
        'Amount value must be a valid number with up to 2 decimal places (e.g., "10.99" or "1099")'
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(propsValue.billing_email.trim())) {
      throw new Error('Invalid email format in billing address');
    }

    const billingAddress: MollieAddress = {
      givenName: propsValue.billing_givenName.trim(),
      familyName: propsValue.billing_familyName?.trim(),
      email: propsValue.billing_email.trim(),
    };

    // Add optional billing address fields
    if (propsValue.billing_organizationName)
      billingAddress.organizationName = propsValue.billing_organizationName;
    if (propsValue.billing_title)
      billingAddress.title = propsValue.billing_title;
    if (propsValue.billing_phone)
      billingAddress.phone = propsValue.billing_phone;
    if (propsValue.billing_streetAndNumber)
      billingAddress.streetAndNumber = propsValue.billing_streetAndNumber;
    if (propsValue.billing_streetAdditional)
      billingAddress.streetAdditional = propsValue.billing_streetAdditional;
    if (propsValue.billing_postalCode)
      billingAddress.postalCode = propsValue.billing_postalCode;
    if (propsValue.billing_city) billingAddress.city = propsValue.billing_city;
    if (propsValue.billing_region)
      billingAddress.region = propsValue.billing_region;
    if (propsValue.billing_country)
      billingAddress.country = propsValue.billing_country;

    const orderData: MollieOrderData = {
      amount: {
        currency: propsValue.amount_currency || 'EUR',
        value: propsValue.amount_value,
      },
      orderNumber: propsValue.orderNumber,
      billingAddress: billingAddress,
    };

    // Add optional fields
    if (propsValue.redirectUrl) {
      orderData.redirectUrl = propsValue.redirectUrl;
    }

    const hasShippingAddress =
      propsValue.shippingAddress_givenName ||
      propsValue.shippingAddress_familyName ||
      propsValue.shippingAddress_streetAndNumber ||
      propsValue.shippingAddress_postalCode ||
      propsValue.shippingAddress_city ||
      propsValue.shippingAddress_country;

    if (hasShippingAddress) {
      const shippingAddress: Partial<MollieAddress> = {};
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

      orderData.shippingAddress = shippingAddress as MollieAddress;
    }

    // Process lines with automatic totalAmount and vatAmount calculation
    if (propsValue.lines && propsValue.lines.length > 0) {
      let calculatedOrderTotal = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orderData.lines = propsValue.lines.map((line: any) => {
        // Parse values as numbers for calculation
        const unitPrice = parseFloat(line.unitPrice_value);
        const quantity = Number(line.quantity);
        const discountAmount = line.discountAmount_value
          ? parseFloat(line.discountAmount_value)
          : 0;
        const vatRate = line.vatRate ? parseFloat(line.vatRate) : 0;

        // Validate numeric values
        if (isNaN(unitPrice) || isNaN(quantity)) {
          throw new Error(
            `Invalid numeric values in line item "${line.name}": unit price or quantity`
          );
        }
        if (line.discountAmount_value && isNaN(discountAmount)) {
          throw new Error(
            `Invalid discount amount in line item "${line.name}"`
          );
        }
        if (line.vatRate && isNaN(vatRate)) {
          throw new Error(`Invalid VAT rate in line item "${line.name}"`);
        }

        // Calculate total amount: (unitPrice × quantity) - discountAmount
        const totalAmount = unitPrice * quantity - discountAmount;

        // Ensure total amount is not negative
        if (totalAmount < 0) {
          throw new Error(
            `Total amount cannot be negative for line item "${line.name}". Check unit price, quantity, and discount amount.`
          );
        }

        // Calculate VAT amount using Mollie's formula: totalAmount × (vatRate / (100 + vatRate))
        let calculatedVatAmount = 0;
        if (vatRate > 0) {
          calculatedVatAmount = totalAmount * (vatRate / (100 + vatRate));
        }

        // Add to running order total for validation
        calculatedOrderTotal += totalAmount;

        const processedLine: MollieOrderLine = {
          name: line.name,
          type: line.type || 'physical',
          quantity: quantity,
          unitPrice: {
            currency: line.unitPrice_currency,
            value: unitPrice.toFixed(2),
          },
          totalAmount: {
            currency: line.unitPrice_currency,
            value: totalAmount.toFixed(2),
          },
        };

        // Add optional fields
        if (line.quantityUnit) processedLine.quantityUnit = line.quantityUnit;

        if (line.discountAmount_value) {
          processedLine.discountAmount = {
            currency: line.discountAmount_currency || line.unitPrice_currency,
            value: discountAmount.toFixed(2),
          };
        }

        if (line.vatRate) {
          processedLine.vatRate = vatRate.toFixed(2);

          // Add calculated VAT amount (not user-provided)
          processedLine.vatAmount = {
            currency: line.unitPrice_currency,
            value: calculatedVatAmount.toFixed(2),
          };

          // Validate user-provided VAT amount if present (and warn about discrepancy)
          if (line.vatAmount_value) {
            const userVatAmount = parseFloat(line.vatAmount_value);
            const tolerance = 0.01; // 1 cent tolerance for rounding

            if (Math.abs(userVatAmount - calculatedVatAmount) > tolerance) {
              console.warn(
                `VAT amount mismatch for line item "${line.name}": ` +
                  `User provided ${userVatAmount.toFixed(
                    2
                  )}, but calculated ${calculatedVatAmount.toFixed(2)} ` +
                  `using formula: totalAmount × (vatRate / (100 + vatRate)). Using calculated value.`
              );
            }
          }
        }

        if (line.sku) processedLine.sku = line.sku;
        if (line.categories && line.categories.length > 0)
          processedLine.categories = line.categories;
        if (line.imageUrl) processedLine.imageUrl = line.imageUrl;
        if (line.productUrl) processedLine.productUrl = line.productUrl;

        return processedLine;
      });

      // Validate that sum of line totals equals order amount
      const orderAmount = parseFloat(propsValue.amount_value);
      const tolerance = 0.01; // Allow 1 cent tolerance for rounding differences

      if (Math.abs(calculatedOrderTotal - orderAmount) > tolerance) {
        throw new Error(
          `Order amount mismatch: Order total is ${propsValue.amount_value} ${propsValue.amount_currency}, ` +
            `but sum of line totals is ${calculatedOrderTotal.toFixed(2)} ${
              propsValue.amount_currency
            }. ` +
            `Difference: ${Math.abs(calculatedOrderTotal - orderAmount).toFixed(
              2
            )}. ` +
            `Please adjust line items or order amount.`
        );
      }
    }

    // Add optional order fields
    if (propsValue.cancelUrl) {
      orderData.cancelUrl = propsValue.cancelUrl;
    }
    if (propsValue.webhookUrl) {
      orderData.webhookUrl = propsValue.webhookUrl;
    }
    if (propsValue.locale) {
      orderData.locale = propsValue.locale as string;
    }
    if (propsValue.method) {
      orderData.allowedMethods = propsValue.method as unknown as string;
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

    // Handle payment-specific fields
    if (propsValue.mandateId || propsValue.sequenceType) {
      const payment: MolliePayment = {};
      if (propsValue.mandateId)
        payment.mandateId = propsValue.mandateId as string;
      if (propsValue.sequenceType)
        payment.sequenceType = propsValue.sequenceType;
      orderData.payment = payment;
    }

    if (propsValue.profileId) {
      orderData.profileId = propsValue.profileId as string;
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
