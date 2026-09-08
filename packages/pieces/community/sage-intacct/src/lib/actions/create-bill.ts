import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient, IntacctObjectReference } from '../client';
import { sageIntacctDropdowns } from '../common/dropdowns';

export const createBillAction = createAction({
  auth: sageIntacctAuth,
  name: 'create_bill',
  classification: 'WRITE',
  displayName: 'Create Bill',
  description: 'Creates a new AP bill in Sage Intacct.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new accounts-payable bill owed to a vendor, with one or more GL account lines. Each call creates a new bill, so retries duplicate.',
    idempotent: false,
  },
  props: {
    vendor: sageIntacctDropdowns.vendorById,
    createdDate: Property.DateTime({ displayName: 'Bill Date', required: true }),
    dueDate: Property.DateTime({ displayName: 'Due Date', required: true }),
    billNumber: Property.ShortText({ displayName: 'Bill Number', required: false }),
    referenceNumber: Property.ShortText({ displayName: 'Reference Number', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    lines: Property.Array({
      displayName: 'Line Items',
      required: true,
      properties: {
        glAccountId: Property.ShortText({
          displayName: 'GL Account ID',
          description: 'The general ledger account number to expense against, e.g. "6000".',
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
    const { vendor, createdDate, dueDate, billNumber, referenceNumber, description, lines } =
      context.propsValue;
    // Property.Array's `properties` sub-schema doesn't thread into propsValue's type (framework limitation).
    const lineItems = lines as BillLineInput[];

    return await sageIntacctClient.apiCall<IntacctObjectReference>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      path: `/objects/${sageIntacctClient.objects.bill}`,
      body: {
        vendor: { id: vendor },
        createdDate: sageIntacctClient.toDate(createdDate),
        dueDate: sageIntacctClient.toDate(dueDate),
        ...spreadIfDefined('billNumber', billNumber),
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

type BillLineInput = {
  glAccountId: string;
  amount: number;
  locationId?: string;
  memo?: string;
};
