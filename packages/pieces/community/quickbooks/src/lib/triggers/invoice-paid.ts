import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksAuth, QuickbooksAuthType } from '../auth';
import { pollingHelper } from '../common/polling-helper';
import { quickbooksCommon, QuickbooksEntityResponse } from '../common';
import { QuickbooksInvoice, QuickbooksPayment } from '../types';

export const invoicePaid = createTrigger({
  name: 'invoice_paid',
  displayName: 'Invoice Paid',
  description: 'Triggers when an invoice is paid in QuickBooks',
  type: TriggerStrategy.POLLING,
  auth: quickbooksAuth,
  props: {
    max_results: Property.Number({
      displayName: 'Maximum Number of Payments',
      description: 'Maximum number of payments to check on each poll (default: 10, max: 1000)',
      required: false,
      defaultValue: 10,
    }),
  },
  sampleData: {
    "payment": {
      "Id": "123",
      "SyncToken": "0",
      "MetaData": {
        "CreateTime": "2023-01-01T12:00:00Z",
        "LastUpdatedTime": "2023-01-01T12:00:00Z"
      },
      "TxnDate": "2023-01-01",
      "CurrencyRef": {
        "value": "USD",
        "name": "United States Dollar"
      },
      "CustomerRef": {
        "value": "1",
        "name": "John Doe"
      },
      "TotalAmt": 500.0,
      "Line": [
        {
          "Amount": 500.0,
          "LinkedTxn": [
            {
              "TxnId": "456",
              "TxnType": "Invoice"
            }
          ]
        }
      ]
    },
    "invoice": {
      "Id": "456",
      "DocNumber": "1001",
      "CustomerRef": {
        "value": "1",
        "name": "John Doe"
      },
      "TotalAmt": 500.0,
      "Balance": 0.0
    }
  },

  async onEnable(context) {
    await pollingHelper.onEnable(context);
  },

  async onDisable(context) {
    await pollingHelper.onDisable(context);
  },

  async run(context) {
    const { max_results } = context.propsValue;
    const { auth } = context;
    const authData = auth as QuickbooksAuthType;

    // Process payments to find linked invoices that are paid
    const processPayments = async (payments: QuickbooksPayment[]) => {
      const results = [];

      for (const payment of payments) {
        // Check if the payment has linked transactions
        if (payment.Line) {
          for (const line of payment.Line) {
            if (line.LinkedTxn) {
              for (const linkedTxn of line.LinkedTxn) {
                // If the linked transaction is an invoice, get the invoice details
                if (linkedTxn.TxnType === 'Invoice') {
                  try {
                    const invoiceResponse = await quickbooksCommon.makeRequest<{ Invoice: QuickbooksInvoice }>({
                      auth: authData,
                      method: HttpMethod.GET,
                      path: `invoice/${linkedTxn.TxnId}`,
                    });

                    const invoice = invoiceResponse.Invoice;

                    // If the invoice balance is 0, it's fully paid
                    if (invoice && invoice.Balance === 0) {
                      results.push({
                        payment,
                        invoice,
                        paymentDate: payment.TxnDate,
                        invoiceNumber: invoice.DocNumber,
                        customerName: invoice.CustomerRef.name,
                        amount: line.Amount,
                      });
                    }
                  } catch (error) {
                    console.error(`Error fetching invoice ${linkedTxn.TxnId}:`, error);
                  }
                }
              }
            }
          }
        }
      }

      return results;
    };

    // Get recent payments
    return await pollingHelper.poll<QuickbooksPayment>(context, {
      entityName: 'Payment',
      orderBy: 'MetaData.LastUpdatedTime DESC',
      maxResults: Math.min(max_results || 10, 1000),
      processItems: processPayments,
    });
  },

  async test(context) {
    const { max_results } = context.propsValue;
    const { auth } = context;
    const authData = auth as QuickbooksAuthType;

    // Process payments to find linked invoices that are paid
    const processPayments = async (payments: QuickbooksPayment[]) => {
      const results = [];

      for (const payment of payments) {
        // Check if the payment has linked transactions
        if (payment.Line) {
          for (const line of payment.Line) {
            if (line.LinkedTxn) {
              for (const linkedTxn of line.LinkedTxn) {
                // If the linked transaction is an invoice, get the invoice details
                if (linkedTxn.TxnType === 'Invoice') {
                  try {
                    const invoiceResponse = await quickbooksCommon.makeRequest<{ Invoice: QuickbooksInvoice }>({
                      auth: authData,
                      method: HttpMethod.GET,
                      path: `invoice/${linkedTxn.TxnId}`,
                    });

                    const invoice = invoiceResponse.Invoice;

                    // If the invoice balance is 0, it's fully paid
                    if (invoice && invoice.Balance === 0) {
                      results.push({
                        payment,
                        invoice,
                        paymentDate: payment.TxnDate,
                        invoiceNumber: invoice.DocNumber,
                        customerName: invoice.CustomerRef.name,
                        amount: line.Amount,
                      });
                    }
                  } catch (error) {
                    console.error(`Error fetching invoice ${linkedTxn.TxnId}:`, error);
                  }
                }
              }
            }
          }
        }
      }

      return results;
    };

    // Get recent payments for testing
    return await pollingHelper.test<QuickbooksPayment>(context, {
      entityName: 'Payment',
      orderBy: 'MetaData.LastUpdatedTime DESC',
      maxResults: Math.min(max_results || 5, 10),
      processItems: processPayments,
    });
  }
});
