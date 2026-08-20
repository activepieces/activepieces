export type PaymentType = 'customer_payment' | 'bill_payment_check' | 'bill_payment_credit_card';

export type ConductorPaymentResult = {
  id: string;
  transactionDate: string;
  refNumber: string | null;
  memo: string | null;
  // Confirmed live (2026-08-20): receive-payments uses `totalAmount`; both bill-payment
  // endpoints use plain `amount` — neither uses `amountDue` (that's the bills resource's own
  // field, not the payment-against-it). Same "same concept, different field name per resource"
  // lesson as invoices/bills.
  totalAmount: string | null;
  amount: string | null;
  customer: { id: string; fullName: string } | null;
  vendor: { id: string; fullName: string } | null;
  revisionNumber: string;
  createdAt: string;
  updatedAt: string;
};

export function isPaymentType(value: string): value is PaymentType {
  return value === 'customer_payment' || value === 'bill_payment_check' || value === 'bill_payment_credit_card';
}

export function flattenPayment({ payment, paymentType }: { payment: ConductorPaymentResult; paymentType: PaymentType }) {
  return {
    id: payment.id,
    payment_type: paymentType,
    transaction_date: payment.transactionDate,
    ref_number: payment.refNumber,
    memo: payment.memo,
    amount: payment.totalAmount ?? payment.amount,
    customer_id: payment.customer?.id ?? null,
    customer_name: payment.customer?.fullName ?? null,
    vendor_id: payment.vendor?.id ?? null,
    vendor_name: payment.vendor?.fullName ?? null,
    revision_number: payment.revisionNumber,
    created_at: payment.createdAt,
    updated_at: payment.updatedAt,
  };
}
