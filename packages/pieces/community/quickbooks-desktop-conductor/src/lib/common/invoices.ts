export type ConductorInvoice = {
  id: string;
  transactionDate: string;
  dueDate: string | null;
  refNumber: string | null;
  memo: string | null;
  customer: { id: string; fullName: string } | null;
  // There's no `total` field — it's derived below from subtotal + salesTaxTotal.
  subtotal: string;
  salesTaxTotal: string | null;
  balanceRemaining: string;
  isPaid: boolean;
  lines: unknown[];
  revisionNumber: string;
  createdAt: string;
  updatedAt: string;
};

function addDecimalStrings(a: string, b: string): string {
  return (Number(a) + Number(b)).toFixed(2);
}

export function flattenInvoice(invoice: ConductorInvoice) {
  return {
    id: invoice.id,
    transaction_date: invoice.transactionDate,
    due_date: invoice.dueDate,
    ref_number: invoice.refNumber,
    memo: invoice.memo,
    customer_id: invoice.customer?.id ?? null,
    customer_name: invoice.customer?.fullName ?? null,
    subtotal_amount: invoice.subtotal,
    sales_tax_amount: invoice.salesTaxTotal,
    total_amount: addDecimalStrings(invoice.subtotal, invoice.salesTaxTotal ?? '0'),
    balance_remaining: invoice.balanceRemaining,
    is_paid: invoice.isPaid,
    line_count: invoice.lines?.length ?? 0,
    revision_number: invoice.revisionNumber,
    created_at: invoice.createdAt,
    updated_at: invoice.updatedAt,
  };
}
