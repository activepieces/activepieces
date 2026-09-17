import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { spreadIfDefined } from '@activepieces/pieces-framework';
import { quickbooksDesktopConductorAuth } from '../auth';
import { conductorClient, withRecordLockRetry, ConductorAuth } from '../common/client';
import { resolveItemIdByName } from '../common/items';
import { customerIdDropdown } from '../common/dropdowns';
import { ConductorInvoice, flattenInvoice } from '../common/invoices';
import { createInvoiceActionOutputSchema } from '../output-schemas';

const MAX_REF_NUMBER_LENGTH = 11;

type LineItemInput = {
  itemName: string;
  description?: string;
  quantity?: number;
  rate?: string;
  amount?: string;
};

function toDateOnly(isoDateTime: string): string {
  return isoDateTime.split('T')[0];
}

export const createInvoiceAction = createAction({
  auth: quickbooksDesktopConductorAuth,
  name: 'create_invoice',
  classification: 'WRITE',
  displayName: 'Create Invoice',
  description: 'Creates an invoice for a customer in QuickBooks Desktop.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new invoice for an existing QuickBooks Desktop customer, with one or more line items. Each line item references a Service or Non-Inventory item by its exact name. Not idempotent — each call creates a new invoice, so retries duplicate it; use Query Transactions first to check whether an equivalent invoice already exists.',
    idempotent: false,
  },
  outputSchema: createInvoiceActionOutputSchema,
  props: {
    customerId: customerIdDropdown({
      required: true,
      description: 'The customer this invoice is for. Only customers that already exist in QuickBooks Desktop appear here — use Upsert Customer first if the customer might not exist yet.',
    }),
    transactionDate: Property.DateTime({
      displayName: 'Invoice Date',
      required: true,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'When left blank, QuickBooks Desktop derives it from the customer\'s default payment terms.',
      required: false,
    }),
    refNumber: Property.ShortText({
      displayName: 'Invoice Number',
      description: `Optional reference number (max ${MAX_REF_NUMBER_LENGTH} characters). QuickBooks Desktop does not auto-generate one if left blank.`,
      required: false,
    }),
    memo: Property.LongText({
      displayName: 'Memo',
      description: 'Internal note. Appears in reports, not on the invoice sent to the customer.',
      required: false,
    }),
    lineItems: Property.Array({
      displayName: 'Line Items',
      description: 'At least one line item is required.',
      required: true,
      properties: {
        itemName: Property.ShortText({
          displayName: 'Item Name',
          description: 'The exact name of a Service or Non-Inventory item in QuickBooks Desktop (Lists > Item List).',
          required: true,
        }),
        description: Property.ShortText({
          displayName: 'Description',
          required: false,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          required: false,
        }),
        rate: Property.ShortText({
          displayName: 'Rate',
          description: 'Price per unit, e.g. "125.00". Ignored if Amount is set.',
          required: false,
        }),
        amount: Property.ShortText({
          displayName: 'Amount',
          description: 'Total for this line, e.g. "500.00". Calculated from Quantity × Rate if left blank.',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const { propsValue } = context;
    const auth: ConductorAuth = {
      secretKey: context.auth.props.secretKey,
      endUserId: context.auth.props.endUserId,
    };

    // Property.Array always resolves to `unknown[]` — its `properties` sub-schema doesn't thread
    // through to the propsValue type — so this cast is unavoidable. The form above guarantees the
    // actual shape.
    const lineItemInputs = propsValue.lineItems as LineItemInput[];
    if (lineItemInputs.length === 0) {
      throw new Error('At least one line item is required to create an invoice.');
    }

    if (propsValue.refNumber && propsValue.refNumber.length > MAX_REF_NUMBER_LENGTH) {
      throw new Error(
        `Invoice Number must be ${MAX_REF_NUMBER_LENGTH} characters or fewer (QuickBooks Desktop's limit) — "${propsValue.refNumber}" is ${propsValue.refNumber.length}.`
      );
    }

    const lines = await Promise.all(
      lineItemInputs.map(async (line) => {
        const itemId = await resolveItemIdByName({ auth, name: line.itemName });
        return {
          itemId,
          ...spreadIfDefined('description', line.description),
          ...spreadIfDefined('quantity', line.quantity),
          ...spreadIfDefined('rate', line.rate),
          ...spreadIfDefined('amount', line.amount),
        };
      })
    );

    const body = {
      customerId: propsValue.customerId,
      transactionDate: toDateOnly(propsValue.transactionDate),
      ...spreadIfDefined('dueDate', propsValue.dueDate ? toDateOnly(propsValue.dueDate) : undefined),
      ...spreadIfDefined('refNumber', propsValue.refNumber),
      ...spreadIfDefined('memo', propsValue.memo),
      lines,
    };

    const createdInvoice = await withRecordLockRetry(() =>
      conductorClient.request<ConductorInvoice>({
        auth,
        method: HttpMethod.POST,
        resourceUri: '/quickbooks-desktop/invoices',
        body,
        // This creates a new invoice — Conductor has no idempotency key, so a blind transport
        // retry on a lost response would create a duplicate. See client.ts's `request` doc.
        safeToRetry: false,
      })
    );
    return flattenInvoice(createdInvoice);
  },
});
