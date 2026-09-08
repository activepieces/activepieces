import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient, IntacctObjectReference } from '../client';
import { sageIntacctDropdowns } from '../common/dropdowns';

export const createVendorInvoiceAction = createAction({
  auth: sageIntacctAuth,
  name: 'create_vendor_invoice',
  classification: 'WRITE',
  displayName: 'Create Vendor Invoice',
  description: 'Creates a new Purchasing vendor invoice in Sage Intacct.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new Purchasing-module vendor invoice with item lines. Distinct from Create Bill, which posts directly to Accounts Payable — a vendor invoice can be configured to generate a corresponding AP bill automatically. Each call creates a new document, so retries duplicate.',
    idempotent: false,
  },
  props: {
    vendor: sageIntacctDropdowns.vendorById,
    txnDate: Property.DateTime({ displayName: 'Transaction Date', required: true }),
    dueDate: Property.DateTime({ displayName: 'Due Date', required: false }),
    referenceNumber: Property.ShortText({ displayName: 'Reference Number', required: false }),
    lines: Property.Array({
      displayName: 'Line Items',
      required: true,
      properties: {
        itemId: Property.ShortText({ displayName: 'Item ID', required: true }),
        warehouseId: Property.ShortText({ displayName: 'Warehouse ID', required: true }),
        locationId: Property.ShortText({ displayName: 'Location ID', required: true }),
        unit: Property.ShortText({
          displayName: 'Unit',
          description: 'Unit of measure, e.g. "Each".',
          required: true,
        }),
        unitQuantity: Property.Number({ displayName: 'Quantity', required: true }),
        unitPrice: Property.Number({ displayName: 'Unit Price', required: true }),
      },
    }),
  },
  async run(context) {
    const { vendor, txnDate, dueDate, referenceNumber, lines } = context.propsValue;
    // Property.Array's `properties` sub-schema doesn't thread into propsValue's type (framework limitation).
    const lineItems = lines as VendorInvoiceLineInput[];

    return await sageIntacctClient.apiCall<IntacctObjectReference>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      path: sageIntacctClient.documentPath({ module: 'purchasing', documentName: 'Vendor Invoice' }),
      body: {
        vendor: { id: vendor },
        txnDate: sageIntacctClient.toDate(txnDate),
        ...spreadIfDefined('dueDate', dueDate ? sageIntacctClient.toDate(dueDate) : undefined),
        ...spreadIfDefined('referenceNumber', referenceNumber),
        lines: lineItems.map((line) => ({
          unit: line.unit,
          unitQuantity: line.unitQuantity,
          unitPrice: line.unitPrice,
          dimensions: {
            item: { id: line.itemId },
            warehouse: { id: line.warehouseId },
            location: { id: line.locationId },
          },
        })),
      },
    });
  },
});

type VendorInvoiceLineInput = {
  itemId: string;
  warehouseId: string;
  locationId: string;
  unit: string;
  unitQuantity: number;
  unitPrice: number;
};
