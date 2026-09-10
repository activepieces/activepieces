import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient, SageAccountingRef } from '../client';
import { sageAccountingDropdowns } from '../common/dropdowns';
import { createServiceActionOutputSchema } from '../output-schemas';

export const createServiceAction = createAction({
  auth: sageAccountingAuth,
  name: 'create_service',
  classification: 'WRITE',
  displayName: 'Create Service',
  description: 'Creates a new service in Sage Accounting.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new service in Sage Accounting, for use as a line item on invoices and quotes. Each call creates a new service, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: createServiceActionOutputSchema,
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
    salesRates: Property.Array({
      displayName: 'Sales Rates',
      description: 'Optionally set a rate for one or more service rate types.',
      required: false,
      properties: {
        serviceRateTypeId: Property.ShortText({
          displayName: 'Service Rate Type ID',
          description: 'Find it under Settings > Service Rate Types in Sage Accounting.',
          required: true,
        }),
        rate: Property.Number({ displayName: 'Rate', required: true }),
        rateIncludesTax: Property.Checkbox({ displayName: 'Rate Includes Tax', required: false }),
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
      salesRates,
    } = context.propsValue;
    // Property.Array's `properties` sub-schema doesn't thread into propsValue's type (framework limitation).
    const salesRateLines = salesRates as SalesRateInput[] | undefined;

    return await sageAccountingClient.apiCall<SageAccountingRef>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      path: sageAccountingClient.paths.services,
      body: {
        service: {
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
          ...(salesRateLines?.length
            ? {
                sales_rates: salesRateLines.map((line) => ({
                  service_rate_type_id: line.serviceRateTypeId,
                  rate: line.rate,
                  ...spreadIfDefined('rate_includes_tax', line.rateIncludesTax),
                })),
              }
            : {}),
        },
      },
    });
  },
});

type SalesRateInput = {
  serviceRateTypeId: string;
  rate: number;
  rateIncludesTax?: boolean;
};
