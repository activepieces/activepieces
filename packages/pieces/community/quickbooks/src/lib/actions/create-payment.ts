import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../..';
import { createQBEntity, QBPayment } from '../common';

export const quickbooksCreatePayment = createAction({
  auth: quickbooksAuth,
  name: 'create_payment',
  displayName: 'Create Payment',
  description: 'Records a customer payment in QuickBooks, optionally linking it to invoices.',
  props: {
    realm_id: Property.ShortText({
      displayName: 'Company ID (Realm ID)',
      description: 'Your QuickBooks Company ID.',
      required: true,
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The QuickBooks ID of the customer making the payment.',
      required: true,
    }),
    total_amount: Property.Number({
      displayName: 'Total Amount',
      description: 'The total payment amount.',
      required: true,
    }),
    txn_date: Property.ShortText({
      displayName: 'Payment Date',
      description: 'Date of the payment (YYYY-MM-DD). Defaults to today.',
      required: false,
    }),
    payment_ref_num: Property.ShortText({
      displayName: 'Payment Reference Number',
      description: 'Reference number for the payment (e.g., check number, transaction ID).',
      required: false,
    }),
    deposit_account_id: Property.ShortText({
      displayName: 'Deposit To Account ID',
      description: 'QuickBooks Account ID to deposit payment into (e.g., Checking account).',
      required: false,
    }),
    invoice_ids: Property.Array({
      displayName: 'Apply to Invoice IDs',
      description: 'List of QuickBooks Invoice IDs this payment applies to. Leave blank for unapplied credit.',
      required: false,
    }),
    use_sandbox: Property.Checkbox({
      displayName: 'Use Sandbox',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      realm_id,
      customer_id,
      total_amount,
      txn_date,
      payment_ref_num,
      deposit_account_id,
      invoice_ids,
      use_sandbox,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      CustomerRef: { value: customer_id },
      TotalAmt: total_amount,
    };

    if (txn_date) body['TxnDate'] = txn_date;
    if (payment_ref_num) body['PaymentRefNum'] = payment_ref_num;
    if (deposit_account_id) body['DepositToAccountRef'] = { value: deposit_account_id };

    // Link to specific invoices if provided
    if (invoice_ids && Array.isArray(invoice_ids) && invoice_ids.length > 0) {
      body['Line'] = invoice_ids.map((invoiceId: unknown) => ({
        Amount: total_amount / invoice_ids.length, // Distribute evenly; user can adjust
        LinkedTxn: [
          {
            TxnId: String(invoiceId),
            TxnType: 'Invoice',
          },
        ],
      }));
    }

    const payment = await createQBEntity<QBPayment>(
      context.auth as any,
      realm_id,
      'payment',
      body,
      use_sandbox ?? false
    );

    return payment;
  },
});
