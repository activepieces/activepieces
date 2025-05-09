import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../auth';
import { quickbooksCommon, QuickbooksEntityResponse } from '../common';
import { QuickbooksCustomer, QuickbooksInvoice, QuickbooksRef } from '../types';

export const createInvoice = createAction({
  name: 'create_invoice',
  displayName: 'Create Invoice',
  description: 'Create a new invoice in QuickBooks',
  auth: quickbooksAuth,
  props: {
    customer_id: Property.Dropdown({
      displayName: 'Customer',
      description: 'The customer for this invoice',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        try {
          const authData = auth as OAuth2PropertyValue;
          const query = quickbooksCommon.buildQuery('Customer', ['Active = true'], 'DisplayName', 100);

          const response = await quickbooksCommon.makeRequest<QuickbooksEntityResponse<QuickbooksCustomer>>({
            auth: authData,
            method: HttpMethod.GET,
            path: 'query',
            query: { query },
          });

          if (response.Fault) {
            throw new Error(`QuickBooks API Error: ${response.Fault.Error.map(e => e.Message).join(', ')}`);
          }

          const customers = response.QueryResponse?.['Customer'] as QuickbooksCustomer[] || [];

          return {
            options: Array.isArray(customers) ? customers.map((customer: QuickbooksCustomer) => ({
              label: customer.DisplayName,
              value: customer.Id,
            })) : [],
          };
        } catch (error) {
          console.error('Error fetching customers:', error);
          return {
            disabled: true,
            placeholder: 'Error fetching customers',
            options: [],
          };
        }
      },
    }),
    invoice_date: Property.DateTime({
      displayName: 'Invoice Date',
      description: 'The date of the invoice (defaults to today)',
      required: false,
    }),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'The due date of the invoice',
      required: false,
    }),
    line_items: Property.Array({
      displayName: 'Line Items',
      description: 'The line items for this invoice',
      required: true,
      properties: {
        description: Property.ShortText({
          displayName: 'Description',
          description: 'Description of the item',
          required: true,
        }),
        amount: Property.Number({
          displayName: 'Amount',
          description: 'The amount for this line item',
          required: true,
        }),
        item_id: Property.ShortText({
          displayName: 'Item ID',
          description: 'The ID of the item (optional)',
          required: false,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'The quantity of the item',
          required: false,
          defaultValue: 1,
        }),
        tax_code: Property.ShortText({
          displayName: 'Tax Code',
          description: 'The tax code for this line item (optional)',
          required: false,
        }),
      },
    }),
    email_invoice: Property.Checkbox({
      displayName: 'Email Invoice',
      description: 'If checked, the invoice will be emailed to the customer',
      required: false,
      defaultValue: false,
    }),
    custom_email_subject: Property.ShortText({
      displayName: 'Custom Email Subject',
      description: 'Custom subject for the email (if sending)',
      required: false,
    }),
    custom_email_message: Property.LongText({
      displayName: 'Custom Email Message',
      description: 'Custom message for the email (if sending)',
      required: false,
    }),
    memo: Property.LongText({
      displayName: 'Memo',
      description: 'A memo to include on the invoice (private note)',
      required: false,
    }),
    customer_memo: Property.LongText({
      displayName: 'Customer Memo',
      description: 'A memo that will be visible to the customer on the invoice',
      required: false,
    }),
    doc_number: Property.ShortText({
      displayName: 'Invoice Number',
      description: 'Custom invoice number (if left blank, QuickBooks will auto-assign)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      customer_id,
      invoice_date,
      due_date,
      line_items,
      email_invoice,
      custom_email_subject,
      custom_email_message,
      memo,
      customer_memo,
      doc_number
    } = propsValue;

    // Format line items for QuickBooks API
    const formattedLineItems = Array.isArray(line_items) ? line_items.map((item: any) => {
      const lineItem: any = {
        DetailType: 'SalesItemLineDetail',
        Amount: item.amount,
        Description: item.description,
        SalesItemLineDetail: {
          Qty: item.quantity || 1,
        },
      };

      if (item.item_id) {
        lineItem.SalesItemLineDetail.ItemRef = {
          value: item.item_id,
        };
      }

      if (item.tax_code) {
        lineItem.SalesItemLineDetail.TaxCodeRef = {
          value: item.tax_code,
        };
      }

      return lineItem;
    }) : [];

    // Create the invoice data
    const invoiceData: Partial<QuickbooksInvoice> = {
      CustomerRef: {
        value: customer_id,
      } as QuickbooksRef,
      Line: formattedLineItems,
    };

    if (invoice_date) {
      // Format date as YYYY-MM-DD
      invoiceData.TxnDate = invoice_date.split('T')[0];
    }

    if (due_date) {
      // Format date as YYYY-MM-DD
      invoiceData.DueDate = due_date.split('T')[0];
    }

    if (memo) {
      invoiceData.PrivateNote = memo;
    }

    if (customer_memo) {
      invoiceData.CustomerMemo = {
        value: customer_memo,
      };
    }

    if (doc_number) {
      invoiceData.DocNumber = doc_number;
    }

    // Create the invoice
    const response = await quickbooksCommon.makeRequest<{ Invoice: QuickbooksInvoice }>({
      auth: auth,
      method: HttpMethod.POST,
      path: 'invoice',
      body: invoiceData,
    });

    // If email_invoice is true, send the invoice via email
    if (email_invoice && response.Invoice && response.Invoice.Id) {
      try {
        const emailData: any = {
          sendTo: response.Invoice.BillEmail?.Address,
        };

        if (custom_email_subject) {
          emailData.subject = custom_email_subject;
        }

        if (custom_email_message) {
          emailData.message = custom_email_message;
        }

        await quickbooksCommon.makeRequest({
          auth: auth,
          method: HttpMethod.POST,
          path: `invoice/${response.Invoice.Id}/send`,
          body: emailData,
        });

        return {
          ...response,
          email_sent: true,
        };
      } catch (error) {
        console.error('Error sending invoice email:', error);
        return {
          ...response,
          email_sent: false,
          email_error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return response;
  },
});
