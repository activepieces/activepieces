import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient, SageAccountingRef } from '../client';
import { sageAccountingDropdowns } from '../common/dropdowns';
import { createProductActionOutputSchema } from '../output-schemas';

export const createProductAction = createAction({
  auth: sageAccountingAuth,
  name: 'create_product',
  classification: 'WRITE',
  displayName: 'Create Product',
  description: 'Creates a new product in Sage Accounting.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new product in Sage Accounting, for use as a line item on invoices and quotes. Each call creates a new product, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: createProductActionOutputSchema,
  props: {
    description: Property.ShortText({ displayName: 'Description', required: true }),
    salesLedgerAccount: sageAccountingDropdowns.productSalesLedgerAccountId,
    purchaseLedgerAccount: sageAccountingDropdowns.productPurchaseLedgerAccountId,
    itemCode: Property.ShortText({ displayName: 'Item Code', required: false }),
    salesTaxRate: sageAccountingDropdowns.salesTaxRateId,
    purchaseTaxRate: sageAccountingDropdowns.purchaseTaxRateId,
    usualSupplier: sageAccountingDropdowns.usualSupplierId,
    costPrice: Property.Number({ displayName: 'Cost Price', required: false }),
    purchaseDescription: Property.ShortText({ displayName: 'Description on Purchase Forms', required: false }),
    notes: Property.LongText({ displayName: 'Notes', required: false }),
    active: Property.Checkbox({ displayName: 'Active', required: false, defaultValue: true }),
    salesPrices: Property.Array({
      displayName: 'Sales Prices',
      description: 'Optionally set a price for one or more product sales price types (e.g. Trade, Wholesale).',
      required: false,
      properties: {
        productSalesPriceTypeId: Property.ShortText({
          displayName: 'Product Sales Price Type ID',
          description: 'Find it under Settings > Product Sales Price Types in Sage Accounting.',
          required: true,
        }),
        price: Property.Number({ displayName: 'Price', required: true }),
        priceIncludesTax: Property.Checkbox({ displayName: 'Price Includes Tax', required: false }),
      },
    }),
  },
  async run(context) {
    const {
      description,
      salesLedgerAccount,
      purchaseLedgerAccount,
      itemCode,
      salesTaxRate,
      purchaseTaxRate,
      usualSupplier,
      costPrice,
      purchaseDescription,
      notes,
      active,
      salesPrices,
    } = context.propsValue;
    // Property.Array's `properties` sub-schema doesn't thread into propsValue's type (framework limitation).
    const salesPriceLines = salesPrices as SalesPriceInput[] | undefined;

    return await sageAccountingClient.apiCall<SageAccountingRef>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      path: sageAccountingClient.paths.products,
      body: {
        product: {
          description,
          sales_ledger_account_id: salesLedgerAccount,
          purchase_ledger_account_id: purchaseLedgerAccount,
          ...spreadIfDefined('item_code', itemCode),
          ...spreadIfDefined('sales_tax_rate_id', salesTaxRate),
          ...spreadIfDefined('purchase_tax_rate_id', purchaseTaxRate),
          ...spreadIfDefined('usual_supplier_id', usualSupplier),
          ...spreadIfDefined('cost_price', costPrice),
          ...spreadIfDefined('purchase_description', purchaseDescription),
          ...spreadIfDefined('notes', notes),
          ...spreadIfDefined('active', active),
          ...(salesPriceLines?.length
            ? {
                sales_prices: salesPriceLines.map((line) => ({
                  product_sales_price_type_id: line.productSalesPriceTypeId,
                  price: line.price,
                  ...spreadIfDefined('price_includes_tax', line.priceIncludesTax),
                })),
              }
            : {}),
        },
      },
    });
  },
});

type SalesPriceInput = {
  productSalesPriceTypeId: string;
  price: number;
  priceIncludesTax?: boolean;
};
