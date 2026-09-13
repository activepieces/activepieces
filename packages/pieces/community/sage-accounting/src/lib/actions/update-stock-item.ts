import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient, SageAccountingRef } from '../client';
import { sageAccountingDropdowns } from '../common/dropdowns';
import { updateStockItemActionOutputSchema } from '../output-schemas';

export const updateStockItemAction = createAction({
  auth: sageAccountingAuth,
  name: 'update_stock_item',
  classification: 'WRITE',
  displayName: 'Update Stock Item',
  description: 'Updates an existing stock item in Sage Accounting.',
  audience: 'both',
  aiMetadata: {
    description:
      'Update fields on an existing Sage Accounting stock item, identified by its ID. Only the fields you provide are changed. Safe to retry with the same values.',
    idempotent: true,
  },
  outputSchema: updateStockItemActionOutputSchema,
  props: {
    stockItem: sageAccountingDropdowns.stockItemById,
    description: Property.ShortText({ displayName: 'Description', required: false }),
    itemCode: Property.ShortText({ displayName: 'Item Code', required: false }),
    notes: Property.LongText({ displayName: 'Notes', required: false }),
    salesLedgerAccount: sageAccountingDropdowns.productSalesLedgerAccountIdOptional,
    salesTaxRate: sageAccountingDropdowns.salesTaxRateId,
    purchaseLedgerAccount: sageAccountingDropdowns.productPurchaseLedgerAccountIdOptional,
    usualSupplier: sageAccountingDropdowns.usualSupplierId,
    purchaseTaxRate: sageAccountingDropdowns.purchaseTaxRateId,
    costPrice: Property.Number({ displayName: 'Cost Price', required: false }),
    purchaseDescription: Property.ShortText({ displayName: 'Description on Purchase Forms', required: false }),
    supplierItemCode: Property.ShortText({ displayName: 'Supplier Item Code', required: false }),
    reorderLevel: Property.Number({ displayName: 'Reorder Level', required: false }),
    reorderQuantity: Property.Number({ displayName: 'Reorder Quantity', required: false }),
    location: Property.ShortText({ displayName: 'Location', required: false }),
    barcode: Property.ShortText({ displayName: 'Barcode', required: false }),
    weight: Property.Number({ displayName: 'Weight', required: false }),
    measurementUnit: Property.ShortText({
      displayName: 'Measurement Unit',
      description: 'The unit the weight is measured in, e.g. "kg" or "lb".',
      required: false,
    }),
    active: Property.Checkbox({ displayName: 'Active', required: false }),
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
      stockItem,
      description,
      itemCode,
      notes,
      salesLedgerAccount,
      salesTaxRate,
      purchaseLedgerAccount,
      usualSupplier,
      purchaseTaxRate,
      costPrice,
      purchaseDescription,
      supplierItemCode,
      reorderLevel,
      reorderQuantity,
      location,
      barcode,
      weight,
      measurementUnit,
      active,
      salesPrices,
    } = context.propsValue;
    // Property.Array's `properties` sub-schema doesn't thread into propsValue's type (framework limitation).
    const salesPriceLines = salesPrices as SalesPriceInput[] | undefined;

    return await sageAccountingClient.apiCall<SageAccountingRef>({
      accessToken: context.auth.access_token,
      method: HttpMethod.PUT,
      path: `${sageAccountingClient.paths.stockItems}/${stockItem}`,
      body: {
        stock_item: {
          ...spreadIfDefined('description', description),
          ...spreadIfDefined('item_code', itemCode),
          ...spreadIfDefined('notes', notes),
          ...spreadIfDefined('sales_ledger_account_id', salesLedgerAccount),
          ...spreadIfDefined('sales_tax_rate_id', salesTaxRate),
          ...spreadIfDefined('purchase_ledger_account_id', purchaseLedgerAccount),
          ...spreadIfDefined('usual_supplier_id', usualSupplier),
          ...spreadIfDefined('purchase_tax_rate_id', purchaseTaxRate),
          ...spreadIfDefined('cost_price', costPrice),
          ...spreadIfDefined('purchase_description', purchaseDescription),
          ...spreadIfDefined('supplier_part_number', supplierItemCode),
          ...spreadIfDefined('reorder_level', reorderLevel),
          ...spreadIfDefined('reorder_quantity', reorderQuantity),
          ...spreadIfDefined('location', location),
          ...spreadIfDefined('barcode', barcode),
          ...spreadIfDefined('weight', weight),
          ...spreadIfDefined('measurement_unit', measurementUnit),
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
