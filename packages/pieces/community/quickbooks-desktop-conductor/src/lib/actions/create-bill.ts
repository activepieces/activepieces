import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { spreadIfDefined } from '@activepieces/pieces-framework';
import { quickbooksDesktopConductorAuth } from '../auth';
import { conductorClient, withRecordLockRetry, ConductorAuth } from '../common/client';
import { resolveAccountIdByName } from '../common/accounts';
import { vendorIdDropdown } from '../common/dropdowns';
import { createBillActionOutputSchema } from '../output-schemas';

const MAX_REF_NUMBER_LENGTH = 20;

type ConductorBill = {
  id: string;
  transactionDate: string;
  dueDate: string | null;
  refNumber: string | null;
  memo: string | null;
  // Vendor references use `fullName`, even though the vendor resource itself only has `name`.
  // And it's `openAmount` here, not `balanceRemaining` — that's the invoice field name.
  vendor: { id: string; fullName: string } | null;
  amountDue: string;
  openAmount: string;
  isPaid: boolean;
  expenseLines: unknown[];
  revisionNumber: string;
  createdAt: string;
  updatedAt: string;
};

type ExpenseLineInput = {
  accountName: string;
  amount: string;
  memo?: string;
};

function toDateOnly(isoDateTime: string): string {
  return isoDateTime.split('T')[0];
}

function flattenBill(bill: ConductorBill) {
  return {
    id: bill.id,
    transaction_date: bill.transactionDate,
    due_date: bill.dueDate,
    ref_number: bill.refNumber,
    memo: bill.memo,
    vendor_id: bill.vendor?.id ?? null,
    vendor_name: bill.vendor?.fullName ?? null,
    amount_due: bill.amountDue,
    balance_remaining: bill.openAmount,
    is_paid: bill.isPaid,
    line_count: bill.expenseLines?.length ?? 0,
    revision_number: bill.revisionNumber,
    created_at: bill.createdAt,
    updated_at: bill.updatedAt,
  };
}

export const createBillAction = createAction({
  auth: quickbooksDesktopConductorAuth,
  name: 'create_bill',
  classification: 'WRITE',
  displayName: 'Create Bill',
  description: 'Creates a vendor bill (accounts payable) in QuickBooks Desktop, expensed against one or more accounts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Record a new bill from an existing vendor, expensed against one or more Chart of Accounts entries (fuel, maintenance, insurance, etc.) — this is the accounts-payable expense-line shape, not an item/inventory purchase. Not idempotent — each call creates a new bill, so retries duplicate it; use Query Transactions first to check whether an equivalent bill already exists.',
    idempotent: false,
  },
  outputSchema: createBillActionOutputSchema,
  props: {
    vendorId: vendorIdDropdown({
      required: true,
      description: 'The vendor this bill is from. Only vendors that already exist in QuickBooks Desktop appear here — use Upsert Vendor first if the vendor might not exist yet.',
    }),
    transactionDate: Property.DateTime({
      displayName: 'Bill Date',
      required: true,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'When left blank, QuickBooks Desktop derives it from the vendor\'s default payment terms.',
      required: false,
    }),
    refNumber: Property.ShortText({
      displayName: 'Bill Number',
      description: `Optional reference number (max ${MAX_REF_NUMBER_LENGTH} characters). QuickBooks Desktop does not auto-generate one if left blank.`,
      required: false,
    }),
    memo: Property.LongText({
      displayName: 'Memo',
      description: 'Internal note. Appears in the A/P register and reports, not sent to the vendor.',
      required: false,
    }),
    expenseLines: Property.Array({
      displayName: 'Expense Lines',
      description: 'At least one expense line is required. Each line expenses this bill against one Chart of Accounts entry (e.g. fuel, maintenance, insurance) — not a product/service item.',
      required: true,
      properties: {
        accountName: Property.ShortText({
          displayName: 'Account Name',
          description: 'The exact Chart of Accounts name in QuickBooks Desktop, e.g. "Automobile Expense" or "Expenses:Fuel" for a sub-account.',
          required: true,
        }),
        amount: Property.ShortText({
          displayName: 'Amount',
          description: 'The amount to expense to this account, e.g. "450.00".',
          required: true,
        }),
        memo: Property.ShortText({
          displayName: 'Line Memo',
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

    // Same Property.Array typing gap as create-invoice.ts's lineItems.
    const expenseLineInputs = propsValue.expenseLines as ExpenseLineInput[];
    if (expenseLineInputs.length === 0) {
      throw new Error('At least one expense line is required to create a bill.');
    }

    if (propsValue.refNumber && propsValue.refNumber.length > MAX_REF_NUMBER_LENGTH) {
      throw new Error(
        `Bill Number must be ${MAX_REF_NUMBER_LENGTH} characters or fewer (QuickBooks Desktop's limit) — "${propsValue.refNumber}" is ${propsValue.refNumber.length}.`
      );
    }

    const expenseLines = await Promise.all(
      expenseLineInputs.map(async (line) => {
        const accountId = await resolveAccountIdByName({ auth, name: line.accountName });
        return {
          accountId,
          amount: line.amount,
          ...spreadIfDefined('memo', line.memo),
        };
      })
    );

    const body = {
      vendorId: propsValue.vendorId,
      transactionDate: toDateOnly(propsValue.transactionDate),
      ...spreadIfDefined('dueDate', propsValue.dueDate ? toDateOnly(propsValue.dueDate) : undefined),
      ...spreadIfDefined('refNumber', propsValue.refNumber),
      ...spreadIfDefined('memo', propsValue.memo),
      expenseLines,
    };

    const createdBill = await withRecordLockRetry(() =>
      conductorClient.request<ConductorBill>({
        auth,
        method: HttpMethod.POST,
        resourceUri: '/quickbooks-desktop/bills',
        body,
        // This creates a new bill — see client.ts's `request` doc on why creates opt out of retry.
        safeToRetry: false,
      })
    );
    return flattenBill(createdBill);
  },
});
