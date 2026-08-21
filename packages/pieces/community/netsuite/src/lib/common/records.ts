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

function buildClassificationRefs(props: {
  departmentId?: unknown;
  classId?: unknown;
  locationId?: unknown;
}): Record<string, unknown> {
  return compact({
    department: toRef(props['departmentId']),
    class: toRef(props['classId']),
    location: toRef(props['locationId']),
  });
}

function buildLineItems(lines: unknown[] | undefined) {
  if (!lines?.length) {
    return undefined;
  }
  const items = lines.filter(isRecord).map((line, index) => {
    const item = toRef(line['itemId']);
    if (!item) {
      throw new Error(`Line ${index + 1} is missing Item ID.`);
    }
    return compact({
      item,
      quantity: line['quantity'],
      rate: line['rate'],
      amount: line['amount'],
      description: line['description'],
      ...buildClassificationRefs(line),
    });
  });
  // A non-empty input array of malformed (non-object) entries filters down to
  // zero items — don't let that produce a truthy-but-empty `{ items: [] }`
  // wrapper that slips past the caller's "at least one line" guard.
  return items.length ? { items } : undefined;
}

function buildExpenseLines(lines: unknown[] | undefined) {
  if (!lines?.length) {
    return undefined;
  }
  const items = lines.filter(isRecord).map((line, index) => {
    const account = toRef(line['accountId']);
    if (!account) {
      throw new Error(`Line ${index + 1} is missing Account ID.`);
    }
    return compact({
      account,
      amount: line['amount'],
      memo: line['memo'],
      ...buildClassificationRefs(line),
    });
  });
  return items.length ? { items } : undefined;
}

function buildPaymentApplications(applications: unknown[] | undefined) {
  if (!applications?.length) {
    return undefined;
  }
  const items = applications.filter(isRecord).map((application, index) => {
    const doc = toRef(application['invoiceId']);
    if (!doc) {
      throw new Error(`Application ${index + 1} is missing Invoice ID.`);
    }
    return compact({
      apply: true,
      doc,
      amount: application['amount'],
      line: application['line'] ?? 0,
    });
  });
  return items.length ? { items } : undefined;
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
  externalId,
}: {
  table: 'customer' | 'vendor';
  email?: string;
  name?: string;
  externalId?: string;
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
  if (externalId) {
    filters.push(`externalId = '${escapeLiteral(externalId)}'`);
  }
  if (!filters.length) {
    return null;
  }
  return `SELECT id, entityId, companyName, email, phone, externalId FROM ${table} WHERE ${filters.join(
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
  departmentId?: unknown;
  classId?: unknown;
  locationId?: unknown;
}): Record<string, unknown> {
  return compact({
    tranDate: props.tranDate,
    dueDate: props.dueDate,
    memo: props.memo,
    subsidiary: toRef(props.subsidiaryId),
    currency: toRef(props.currencyId),
    terms: toRef(props.termsId),
    externalId: props.externalId,
    ...buildClassificationRefs(props),
  });
}

const classificationFields = {
  departmentId: Property.ShortText({
    displayName: 'Department ID',
    description: 'Internal id of the department.',
    required: false,
  }),
  classId: Property.ShortText({
    displayName: 'Class ID',
    description: 'Internal id of the class.',
    required: false,
  }),
  locationId: Property.ShortText({
    displayName: 'Location ID',
    description:
      'Internal id of the location. Whether department/class/location apply at the ' +
      "transaction header or per line depends on this NetSuite account's own accounting " +
      'preference (Setup > Accounting > Preferences > "Per-Line" classification) — set the ' +
      'field at whichever level your account actually uses; the other level is ignored.',
    required: false,
  }),
};

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
    ...classificationFields,
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
    ...classificationFields,
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
    line: Property.Number({
      displayName: 'Apply Sublist Line',
      description:
        "Line index on the invoice's own apply sublist. Leave as 0 unless NetSuite reports " +
        'duplicate matches for this invoice.',
      required: false,
    }),
  },
});

const additionalFieldsProp = Property.Object({
  displayName: 'Additional Fields',
  description:
    'Any other NetSuite record fields, e.g. {"postingPeriod": {"id": "21"}, "location": {"id": "1"}}. Merged into the request body and overrides the fields above.',
  required: false,
});

const termsProp = Property.ShortText({
  displayName: 'Terms ID',
  description: 'Internal id of the default payment terms for this record.',
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
  ...classificationFields,
};

export const netsuiteRecords = {
  toRef,
  compact,
  buildLineItems,
  buildExpenseLines,
  buildPaymentApplications,
  buildTransactionScalars,
  buildEntitySearchQuery,
  buildClassificationRefs,
  lineItemsProp,
  expenseLinesProp,
  paymentApplicationsProp,
  additionalFieldsProp,
  transactionProps,
  classificationFields,
  termsProp,
};
