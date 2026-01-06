import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { tidelyAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const importInvoice = createAction({
  auth: tidelyAuth,
  name: 'importInvoice',
  displayName: 'Import Invoice',
  description: 'Create, update, or delete an invoice in Tidely',
  props: {
    invoiceId: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'Unique identifier for the invoice',
      required: false,
    }),
    invoiceNumber: Property.ShortText({
      displayName: 'Invoice Number',
      description: 'Invoice number or reference',
      required: true,
    }),
    contactName: Property.ShortText({
      displayName: 'Contact Name',
      description: 'Name of the contact/customer',
      required: true,
    }),
    invoiceDate: Property.ShortText({
      displayName: 'Invoice Date',
      description:
        'Date the invoice was issued (format: dd/MM/yy, M/dd/yy, or yyyy-MM-dd)',
      required: true,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description:
        'Date the invoice is due (format: dd/MM/yy, M/dd/yy, or yyyy-MM-dd)',
      required: false,
    }),
    paidDate: Property.ShortText({
      displayName: 'Paid Date',
      description:
        "Date the invoice was paid (format: yyyy-MM-dd HH:mm:ss or yyyy-MM-dd'T'HH:mm:ss)",
      required: false,
    }),
    createdDate: Property.ShortText({
      displayName: 'Created Date',
      description:
        'Date the invoice was created (format: dd/MM/yy, M/dd/yy, or yyyy-MM-dd)',
      required: false,
    }),
    updatedDate: Property.ShortText({
      displayName: 'Updated Date',
      description:
        'Date the invoice was last updated (format: dd/MM/yy, M/dd/yy, or yyyy-MM-dd)',
      required: false,
    }),
    invoiceType: Property.StaticDropdown({
      displayName: 'Invoice Type',
      description: 'Type of invoice',
      required: true,
      options: {
        options: [
          { label: 'Sales Invoice', value: 'SALES_INVOICE' },
          { label: 'Purchase Invoice', value: 'PURCHASE_INVOICE' },
          { label: 'Credit Note', value: 'CREDIT_NOTE' },
          { label: 'Debit Note', value: 'DEBIT_NOTE' },
        ],
      },
    }),
    invoiceStatus: Property.StaticDropdown({
      displayName: 'Invoice Status',
      description: 'Current status of the invoice',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Sent', value: 'SENT' },
          { label: 'Viewed', value: 'VIEWED' },
          { label: 'Overdue', value: 'OVERDUE' },
          { label: 'Paid', value: 'PAID' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ],
      },
    }),
    totalNetAmount: Property.Number({
      displayName: 'Total Net Amount',
      description: 'Total amount before tax',
      required: true,
    }),
    totalTaxAmount: Property.Number({
      displayName: 'Total Tax Amount',
      description: 'Total tax amount',
      required: false,
    }),
    totalGrossAmount: Property.Number({
      displayName: 'Total Gross Amount',
      description: 'Total amount including tax',
      required: true,
    }),
    openAmount: Property.Number({
      displayName: 'Open Amount',
      description: 'Amount still outstanding',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Currency code (e.g., USD, EUR, GBP)',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Invoice description or notes',
      required: false,
    }),
    categoryId: Property.Number({
      displayName: 'Category ID',
      description: 'ID of the invoice category',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      invoiceNumber: context.propsValue.invoiceNumber,
      contactName: context.propsValue.contactName,
      invoiceDate: context.propsValue.invoiceDate,
      invoiceType: context.propsValue.invoiceType,
      totalNetAmount: context.propsValue.totalNetAmount,
      totalGrossAmount: context.propsValue.totalGrossAmount,
      currency: context.propsValue.currency,
    };

    if (context.propsValue.invoiceId) {
      body['invoiceId'] = context.propsValue.invoiceId;
    }
    if (context.propsValue.dueDate) {
      body['dueDate'] = context.propsValue.dueDate;
    }
    if (context.propsValue.paidDate) {
      body['paidDate'] = context.propsValue.paidDate;
    }
    if (context.propsValue.createdDate) {
      body['createdDate'] = context.propsValue.createdDate;
    }
    if (context.propsValue.updatedDate) {
      body['updatedDate'] = context.propsValue.updatedDate;
    }
    if (context.propsValue.invoiceStatus) {
      body['invoiceStatus'] = context.propsValue.invoiceStatus;
    }
    if (
      context.propsValue.totalTaxAmount !== undefined &&
      context.propsValue.totalTaxAmount !== null
    ) {
      body['totalTaxAmount'] = context.propsValue.totalTaxAmount;
    }
    if (
      context.propsValue.openAmount !== undefined &&
      context.propsValue.openAmount !== null
    ) {
      body['openAmount'] = context.propsValue.openAmount;
    }
    if (context.propsValue.description) {
      body['description'] = context.propsValue.description;
    }
    if (
      context.propsValue.categoryId !== undefined &&
      context.propsValue.categoryId !== null
    ) {
      body['categoryId'] = context.propsValue.categoryId;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/open-api/invoices',
      body
    );

    return response;
  },
});
