import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient, SageAccountingRef } from '../client';
import { sageAccountingDropdowns } from '../common/dropdowns';
import { createSalesQuoteActionOutputSchema } from '../output-schemas';

export const createSalesQuoteAction = createAction({
  auth: sageAccountingAuth,
  name: 'create_sales_quote',
  classification: 'WRITE',
  displayName: 'Create Sales Quote',
  description: 'Creates a new sales quote in Sage Accounting.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new sales quote for a customer, with one or more ledger account lines. Each call creates a new quote, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: createSalesQuoteActionOutputSchema,
  propertyGroups: [
    {
      key: 'mainAddress',
      display: 'section',
      label: 'Main Address',
      icon: 'send',
      props: ['mainAddressLine1', 'mainAddressLine2', 'mainAddressCity', 'mainAddressPostalCode', 'mainAddressCountry', 'mainAddressRegion', 'mainAddressType'],
    },
    {
      key: 'deliveryAddress',
      display: 'section',
      label: 'Delivery Address',
      icon: 'send',
      props: ['deliveryAddressLine1', 'deliveryAddressLine2', 'deliveryAddressCity', 'deliveryAddressPostalCode', 'deliveryAddressCountry', 'deliveryAddressRegion', 'deliveryAddressType'],
    },
  ],
  props: {
    customer: sageAccountingDropdowns.customerById,
    date: Property.DateTime({ displayName: 'Quote Date', required: true }),
    expiryDate: Property.DateTime({ displayName: 'Expiry Date', required: true }),
    reference: Property.ShortText({ displayName: 'Reference', required: false }),
    notes: Property.LongText({ displayName: 'Notes', required: false }),

    mainAddressLine1: Property.ShortText({ displayName: 'Main Address Line 1', required: false }),
    mainAddressLine2: Property.ShortText({ displayName: 'Main Address Line 2', required: false }),
    mainAddressCity: Property.ShortText({ displayName: 'Main Address City', required: false }),
    mainAddressPostalCode: Property.ShortText({ displayName: 'Main Address Postal Code or Zipcode', required: false }),
    mainAddressCountry: sageAccountingDropdowns.countryId,
    mainAddressRegion: Property.ShortText({ displayName: 'Main Address Region', required: false }),
    mainAddressType: sageAccountingDropdowns.addressTypeId,

    deliveryAddressLine1: Property.ShortText({ displayName: 'Delivery Address Line 1', required: false }),
    deliveryAddressLine2: Property.ShortText({ displayName: 'Delivery Address Line 2', required: false }),
    deliveryAddressCity: Property.ShortText({ displayName: 'Delivery Address City', required: false }),
    deliveryAddressPostalCode: Property.ShortText({ displayName: 'Delivery Address Postal Code or Zipcode', required: false }),
    deliveryAddressCountry: sageAccountingDropdowns.countryId,
    deliveryAddressRegion: Property.ShortText({ displayName: 'Delivery Address Region', required: false }),
    deliveryAddressType: sageAccountingDropdowns.addressTypeId,

    lines: Property.Array({
      displayName: 'Line Items',
      required: true,
      properties: {
        ledgerAccountId: Property.ShortText({
          displayName: 'Ledger Account ID',
          description: 'The ledger account to post this line to. Find it under Settings > Chart of Accounts in Sage Accounting.',
          required: true,
        }),
        description: Property.ShortText({ displayName: 'Description', required: true }),
        quantity: Property.Number({ displayName: 'Quantity', required: true, defaultValue: 1 }),
        unitPrice: Property.Number({ displayName: 'Unit Price', required: true }),
        productId: Property.ShortText({
          displayName: 'Product Code (Product ID)',
          description: 'The product this line relates to, if any. Use the Find Product action to look up its ID.',
          required: false,
        }),
        taxRateId: Property.ShortText({
          displayName: 'Tax Rate ID',
          description: 'The tax rate to apply to this line. Find it under Settings > Tax Rates in Sage Accounting.',
          required: false,
        }),
        taxAmount: Property.Number({
          displayName: 'Tax Amount',
          description: 'Overrides the tax amount for this line. If left blank, Sage calculates it from the tax rate.',
          required: false,
        }),
        discountAmount: Property.Number({ displayName: 'Discount Amount', required: false }),
        euGoodsServicesTypeId: Property.ShortText({
          displayName: 'EU Goods or Services Type ID',
          description: 'Find it under Settings > EU Goods or Services Types in Sage Accounting. Only relevant for EU cross-border sales.',
          required: false,
        }),
        euSalesDescriptionId: Property.ShortText({
          displayName: 'EU Sales Description ID',
          description: 'Find it under Settings > EU Sales Descriptions in Sage Accounting. Only relevant for EU cross-border sales.',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const {
      customer,
      date,
      expiryDate,
      reference,
      notes,
      mainAddressLine1,
      mainAddressLine2,
      mainAddressCity,
      mainAddressPostalCode,
      mainAddressCountry,
      mainAddressRegion,
      mainAddressType,
      deliveryAddressLine1,
      deliveryAddressLine2,
      deliveryAddressCity,
      deliveryAddressPostalCode,
      deliveryAddressCountry,
      deliveryAddressRegion,
      deliveryAddressType,
      lines,
    } = context.propsValue;
    // Property.Array's `properties` sub-schema doesn't thread into propsValue's type (framework limitation).
    const lineItems = lines as QuoteLineInput[];

    const hasMainAddress = [mainAddressLine1, mainAddressLine2, mainAddressCity, mainAddressPostalCode, mainAddressCountry, mainAddressRegion, mainAddressType].some((value) => value !== undefined);
    const hasDeliveryAddress = [deliveryAddressLine1, deliveryAddressLine2, deliveryAddressCity, deliveryAddressPostalCode, deliveryAddressCountry, deliveryAddressRegion, deliveryAddressType].some((value) => value !== undefined);

    return await sageAccountingClient.apiCall<SageAccountingRef>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      path: sageAccountingClient.paths.salesQuotes,
      body: {
        sales_quote: {
          contact_id: customer,
          date: sageAccountingClient.toDate(date),
          expiry_date: sageAccountingClient.toDate(expiryDate),
          ...spreadIfDefined('reference', reference),
          ...spreadIfDefined('notes', notes),
          ...(hasMainAddress
            ? {
                main_address: {
                  ...spreadIfDefined('address_line_1', mainAddressLine1),
                  ...spreadIfDefined('address_line_2', mainAddressLine2),
                  ...spreadIfDefined('city', mainAddressCity),
                  ...spreadIfDefined('postal_code', mainAddressPostalCode),
                  ...spreadIfDefined('country_id', mainAddressCountry),
                  ...spreadIfDefined('region', mainAddressRegion),
                  ...spreadIfDefined('address_type_id', mainAddressType),
                },
              }
            : {}),
          ...(hasDeliveryAddress
            ? {
                delivery_address: {
                  ...spreadIfDefined('address_line_1', deliveryAddressLine1),
                  ...spreadIfDefined('address_line_2', deliveryAddressLine2),
                  ...spreadIfDefined('city', deliveryAddressCity),
                  ...spreadIfDefined('postal_code', deliveryAddressPostalCode),
                  ...spreadIfDefined('country_id', deliveryAddressCountry),
                  ...spreadIfDefined('region', deliveryAddressRegion),
                  ...spreadIfDefined('address_type_id', deliveryAddressType),
                },
              }
            : {}),
          quote_lines: lineItems.map((line) => ({
            ledger_account_id: line.ledgerAccountId,
            description: line.description,
            quantity: line.quantity ?? 1,
            unit_price: line.unitPrice,
            ...spreadIfDefined('product_id', line.productId),
            ...spreadIfDefined('tax_rate_id', line.taxRateId),
            ...spreadIfDefined('tax_amount', line.taxAmount),
            ...spreadIfDefined('discount_amount', line.discountAmount),
            ...spreadIfDefined('eu_goods_services_type_id', line.euGoodsServicesTypeId),
            ...spreadIfDefined('eu_sales_description_id', line.euSalesDescriptionId),
          })),
        },
      },
    });
  },
});

type QuoteLineInput = {
  ledgerAccountId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  productId?: string;
  taxRateId?: string;
  taxAmount?: number;
  discountAmount?: number;
  euGoodsServicesTypeId?: string;
  euSalesDescriptionId?: string;
};
