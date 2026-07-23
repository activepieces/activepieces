import { Property } from '@activepieces/pieces-framework';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toRef(id: unknown): { id: string } | undefined {
  if (id === undefined || id === null || id === '') {
    return undefined;
  }
  return { id: String(id) };
}

function compact(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

function buildLineItems(lines: unknown[] | undefined) {
  if (!lines?.length) {
    return undefined;
  }
  return {
    items: lines.filter(isRecord).map((line) =>
      compact({
        item: toRef(line['itemId']),
        quantity: line['quantity'],
        rate: line['rate'],
        amount: line['amount'],
        description: line['description'],
      })
    ),
  };
}

function buildExpenseLines(lines: unknown[] | undefined) {
  if (!lines?.length) {
    return undefined;
  }
  return {
    items: lines.filter(isRecord).map((line) =>
      compact({
        account: toRef(line['accountId']),
        amount: line['amount'],
        memo: line['memo'],
      })
    ),
  };
}

function buildPaymentApplications(applications: unknown[] | undefined) {
  if (!applications?.length) {
    return undefined;
  }
  return {
    items: applications.filter(isRecord).map((application) =>
      compact({
        apply: true,
        doc: toRef(application['invoiceId']),
        amount: application['amount'],
      })
    ),
  };
}

function escapeLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

// Backslash-escape the SuiteQL LIKE wildcards so user-typed % and _ match
// literally (paired with an ESCAPE '\' clause on the predicate).
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function buildEntitySearchQuery({
  table,
  email,
  name,
}: {
  table: 'customer' | 'vendor';
  email?: string;
  name?: string;
}): string | null {
  const filters: string[] = [];
  if (email) {
    filters.push(`email = '${escapeLiteral(email)}'`);
  }
  if (name) {
    const pattern = escapeLiteral(escapeLikePattern(name));
    filters.push(
      `(companyName LIKE '%${pattern}%' ESCAPE '\\' OR entityId LIKE '%${pattern}%' ESCAPE '\\')`
    );
  }
  if (!filters.length) {
    return null;
  }
  return `SELECT id, entityId, companyName, email, phone FROM ${table} WHERE ${filters.join(
    ' AND '
  )}`;
}

function buildTransactionScalars(props: {
  tranDate?: string;
  dueDate?: string;
  memo?: string;
  subsidiaryId?: string;
  currencyId?: string;
  termsId?: string;
  externalId?: string;
}): Record<string, unknown> {
  return compact({
    tranDate: props.tranDate,
    dueDate: props.dueDate,
    memo: props.memo,
    subsidiary: toRef(props.subsidiaryId),
    currency: toRef(props.currencyId),
    terms: toRef(props.termsId),
    externalId: props.externalId,
  });
}

const lineItemsProp = Property.Array({
  displayName: 'Line Items',
  description: 'Item lines for this transaction.',
  required: false,
  properties: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'Internal id of the item.',
      required: true,
    }),
    quantity: Property.Number({ displayName: 'Quantity', required: false }),
    rate: Property.Number({ displayName: 'Rate', required: false }),
    amount: Property.Number({ displayName: 'Amount', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
  },
});

const expenseLinesProp = Property.Array({
  displayName: 'Expense Lines',
  description: 'Expense (account) lines for this bill.',
  required: false,
  properties: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      description: 'Internal id of the expense account.',
      required: true,
    }),
    amount: Property.Number({ displayName: 'Amount', required: true }),
    memo: Property.LongText({ displayName: 'Memo', required: false }),
  },
});

const paymentApplicationsProp = Property.Array({
  displayName: 'Apply to Invoices',
  description: 'Invoices to apply this payment against.',
  required: false,
  properties: {
    invoiceId: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'Internal id of the open invoice.',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Amount to apply to this invoice.',
      required: true,
    }),
  },
});

const additionalFieldsProp = Property.Object({
  displayName: 'Additional Fields',
  description:
    'Any other NetSuite record fields, e.g. {"postingPeriod": {"id": "21"}, "location": {"id": "1"}}. Merged into the request body and overrides the fields above.',
  required: false,
});

const transactionProps = {
  tranDate: Property.ShortText({
    displayName: 'Transaction Date',
    description: 'Transaction date in YYYY-MM-DD format.',
    required: false,
  }),
  dueDate: Property.ShortText({
    displayName: 'Due Date',
    description: 'Due date in YYYY-MM-DD format.',
    required: false,
  }),
  memo: Property.LongText({ displayName: 'Memo', required: false }),
  subsidiaryId: Property.ShortText({
    displayName: 'Subsidiary ID',
    description: 'Internal id of the subsidiary. Required on OneWorld accounts.',
    required: false,
  }),
  currencyId: Property.ShortText({
    displayName: 'Currency ID',
    required: false,
  }),
  termsId: Property.ShortText({ displayName: 'Terms ID', required: false }),
  externalId: Property.ShortText({
    displayName: 'External ID',
    description: 'Your own unique id for this record; useful for idempotency.',
    required: false,
  }),
};

export const netsuiteRecords = {
  toRef,
  compact,
  buildLineItems,
  buildExpenseLines,
  buildPaymentApplications,
  buildTransactionScalars,
  buildEntitySearchQuery,
  lineItemsProp,
  expenseLinesProp,
  paymentApplicationsProp,
  additionalFieldsProp,
  transactionProps,
};
