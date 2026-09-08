import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient, IntacctObjectReference } from '../client';
import { sageIntacctDropdowns } from '../common/dropdowns';

export const createInvoiceAction = createAction({
  auth: sageIntacctAuth,
  name: 'create_invoice',
  classification: 'WRITE',
  displayName: 'Create Invoice',
  description: 'Creates a new AR invoice in Sage Intacct.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new accounts-receivable invoice billed to a customer, with one or more GL account lines. Each call creates a new invoice, so retries duplicate.',
    idempotent: false,
  },
  props: {
    customer: sageIntacctDropdowns.customerById,
    invoiceDate: Property.DateTime({
      displayName: 'Invoice Date',
      required: true,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: true,
    }),
    invoiceNumber: Property.ShortText({
      displayName: 'Invoice Number',
      description: 'Auto-generated if left blank, e.g. "SI-0034".',
      required: false,
    }),
    referenceNumber: Property.ShortText({ displayName: 'Reference Number', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    lines: Property.Array({
      displayName: 'Line Items',
      required: true,
      properties: {
        glAccountId: Property.ShortText({
          displayName: 'GL Account ID',
          description: 'The general ledger account number to bill against, e.g. "5004".',
          required: true,
        }),
        amount: Property.Number({ displayName: 'Amount', required: true }),
        locationId: Property.ShortText({
          displayName: 'Location ID',
          description: 'Only required if your company tracks transactions by location.',
          required: false,
        }),
        memo: Property.ShortText({ displayName: 'Memo', required: false }),
      },
    }),
  },
  async run(context) {
    const { customer, invoiceDate, dueDate, invoiceNumber, referenceNumber, description, lines } =
      context.propsValue;
    // Property.Array's `properties` sub-schema doesn't thread into propsValue's type (framework limitation).
    const lineItems = lines as InvoiceLineInput[];

    return await sageIntacctClient.apiCall<IntacctObjectReference>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      path: `/objects/${sageIntacctClient.objects.arInvoice}`,
      body: {
        customer: { id: customer },
        invoiceDate: sageIntacctClient.toDate(invoiceDate),
        dueDate: sageIntacctClient.toDate(dueDate),
        ...spreadIfDefined('invoiceNumber', invoiceNumber),
        ...spreadIfDefined('referenceNumber', referenceNumber),
        ...spreadIfDefined('description', description),
        lines: lineItems.map((line) => ({
          txnAmount: line.amount,
          glAccount: { id: line.glAccountId },
          ...(line.locationId ? { dimensions: { location: { id: line.locationId } } } : {}),
          ...spreadIfDefined('memo', line.memo),
        })),
      },
    });
  },
});

type InvoiceLineInput = {
  glAccountId: string;
  amount: number;
  locationId?: string;
  memo?: string;
};
