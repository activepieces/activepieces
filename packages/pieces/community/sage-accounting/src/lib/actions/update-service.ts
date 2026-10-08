import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient, SageAccountingRef } from '../client';
import { sageAccountingDropdowns } from '../common/dropdowns';
import { updateServiceActionOutputSchema } from '../output-schemas';

export const updateServiceAction = createAction({
  auth: sageAccountingAuth,
  name: 'update_service',
  classification: 'WRITE',
  displayName: 'Update Service',
  description: 'Updates an existing service in Sage Accounting.',
  audience: 'both',
  aiMetadata: {
    description:
      'Update fields on an existing Sage Accounting service, identified by its ID. Only the fields you provide are changed. Safe to retry with the same values.',
    idempotent: true,
  },
  outputSchema: updateServiceActionOutputSchema,
  props: {
    service: sageAccountingDropdowns.serviceById,
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
    active: Property.Checkbox({ displayName: 'Active', required: false }),
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
      service,
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
      active,
      salesRates,
    } = context.propsValue;
    // Property.Array's `properties` sub-schema doesn't thread into propsValue's type (framework limitation).
    const salesRateLines = salesRates as SalesRateInput[] | undefined;

    return await sageAccountingClient.apiCall<SageAccountingRef>({
      accessToken: context.auth.access_token,
      method: HttpMethod.PUT,
      path: `${sageAccountingClient.paths.services}/${service}`,
      body: {
        service: {
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
