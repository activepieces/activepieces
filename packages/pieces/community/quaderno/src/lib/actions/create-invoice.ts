import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { quadernoAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const createInvoice = createAction({
  auth: quadernoAuth,
  name: 'createInvoice',
  displayName: 'Create Invoice',
  description: 'Create a new invoice in Quaderno',
  props: {
    issueDate: Property.ShortText({
      displayName: 'Issue Date',
      description: 'Date when the invoice was issued (YYYY-MM-DD)',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: '3-letter ISO currency code (USD, EUR, GBP, etc.)',
      required: true,
    }),
    invoiceNumber: Property.ShortText({
      displayName: 'Invoice Number',
      description: 'A unique, sequential code that identifies the invoice',
      required: false,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'Date on which payment for this invoice is due (YYYY-MM-DD)',
      required: false,
    }),
    customerFirstName: Property.ShortText({
      displayName: 'Customer First Name',
      description: "The customer's first name",
      required: true,
    }),
    customerLastName: Property.ShortText({
      displayName: 'Customer Last Name',
      description: "The customer's last name",
      required: false,
    }),
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      description: "The customer's email address",
      required: false,
    }),
    customerCountry: Property.ShortText({
      displayName: 'Customer Country',
      description: '2-letter ISO country code (e.g., US, GB)',
      required: false,
    }),
    itemDescription: Property.ShortText({
      displayName: 'Item Description',
      description: 'Description of the invoice line item',
      required: true,
    }),
    itemQuantity: Property.Number({
      displayName: 'Item Quantity',
      description: 'Quantity of the invoice item',
      required: true,
    }),
    itemUnitCost: Property.ShortText({
      displayName: 'Item Unit Cost',
      description: 'Unit cost of the invoice item',
      required: true,
    }),
    poNumber: Property.ShortText({
      displayName: 'PO Number',
      description: 'Purchase order number',
      required: false,
    }),
    tagList: Property.ShortText({
      displayName: 'Tags',
      description: 'Tags attached to the invoice (comma-separated)',
      required: false,
    }),
    notes: Property.ShortText({
      displayName: 'Notes',
      description: 'Extra notes about the invoice',
      required: false,
    }),
  },
  async run(context) {
    const customerData: any = {
      first_name: context.propsValue.customerFirstName,
      kind: 'person',
    };

    if (context.propsValue.customerLastName) {
      customerData.last_name = context.propsValue.customerLastName;
    }
    if (context.propsValue.customerEmail) {
      customerData.email = context.propsValue.customerEmail;
    }
    if (context.propsValue.customerCountry) {
      customerData.country = context.propsValue.customerCountry;
    }

    const itemsData = [
      {
        description: context.propsValue.itemDescription,
        quantity: context.propsValue.itemQuantity,
        unit_cost: context.propsValue.itemUnitCost,
      },
    ];

    const invoiceData: any = {
      issue_date: context.propsValue.issueDate,
      currency: context.propsValue.currency,
      contact: customerData,
      items: itemsData,
    };

    if (context.propsValue.invoiceNumber) {
      invoiceData.number = context.propsValue.invoiceNumber;
    }
    if (context.propsValue.dueDate) {
      invoiceData.due_date = context.propsValue.dueDate;
    }
    if (context.propsValue.poNumber) {
      invoiceData.po_number = context.propsValue.poNumber;
    }
    if (context.propsValue.tagList) {
      invoiceData.tag_list = context.propsValue.tagList
        .split(',')
        .map((tag: string) => tag.trim());
    }
    if (context.propsValue.notes) {
      invoiceData.notes = context.propsValue.notes;
    }

    return await makeRequest(
      context.auth.props.account_name,
      context.auth.props.api_key,
      HttpMethod.POST,
      '/invoices',
      invoiceData
    );
  },
});
