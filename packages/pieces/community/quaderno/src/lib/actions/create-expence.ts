import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { quadernoAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const createExpense = createAction({
  auth: quadernoAuth,
  name: 'createExpense',
  displayName: 'Create Expense',
  description: 'Create a new expense in Quaderno',
  props: {
    issueDate: Property.ShortText({
      displayName: 'Issue Date',
      description: 'Date when the expense was issued (YYYY-MM-DD)',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: '3-letter ISO currency code (USD, EUR, GBP, etc.)',
      required: true,
    }),
    contactFirstName: Property.ShortText({
      displayName: 'Vendor First Name',
      description: "The vendor's first name",
      required: true,
    }),
    contactLastName: Property.ShortText({
      displayName: 'Vendor Last Name',
      description: "The vendor's last name (optional for person contacts)",
      required: false,
    }),
    contactEmail: Property.ShortText({
      displayName: 'Vendor Email',
      description: "The vendor's email address",
      required: false,
    }),
    contactCountry: Property.ShortText({
      displayName: 'Vendor Country',
      description: '2-letter ISO country code (e.g., US, GB)',
      required: true,
    }),
    itemDescription: Property.ShortText({
      displayName: 'Item Description',
      description: 'Description of the expense item',
      required: true,
    }),
    itemQuantity: Property.Number({
      displayName: 'Item Quantity',
      description: 'Quantity of the expense item',
      required: true,
    }),
    itemUnitCost: Property.ShortText({
      displayName: 'Item Unit Cost',
      description: 'Unit cost of the expense item',
      required: true,
    }),
    paymentMethod: Property.StaticDropdown({
      displayName: 'Payment Method',
      description: 'How the expense was paid',
      options: {
        options: [
          { label: 'Credit Card', value: 'credit_card' },
          { label: 'Cash', value: 'cash' },
          { label: 'Wire Transfer', value: 'wire_transfer' },
          { label: 'Direct Debit', value: 'direct_debit' },
          { label: 'Check', value: 'check' },
          { label: 'IOU', value: 'iou' },
          { label: 'PayPal', value: 'paypal' },
          { label: 'Other', value: 'other' },
        ],
      },
      required: true,
    }),
    country: Property.ShortText({
      displayName: 'Expense Country',
      description: '2-letter ISO country code for the expense location',
      required: true,
    }),
    poNumber: Property.ShortText({
      displayName: 'Purchase Order Number',
      description: 'Purchase order number (optional)',
      required: false,
    }),
    tagList: Property.ShortText({
      displayName: 'Tags',
      description: 'Tags for the expense, separated by commas',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional notes about the expense',
      required: false,
    }),
  },
  async run(context) {
    
    const contactData: any = {
      first_name: context.propsValue.contactFirstName,
      country: context.propsValue.contactCountry,
      kind: 'person',
    };

    if (context.propsValue.contactLastName) {
      contactData.last_name = context.propsValue.contactLastName;
    }
    if (context.propsValue.contactEmail) {
      contactData.email = context.propsValue.contactEmail;
    }

    // Build item data object
    const itemsData = [
      {
        description: context.propsValue.itemDescription,
        quantity: context.propsValue.itemQuantity,
        unit_cost: context.propsValue.itemUnitCost,
      },
    ];

    // Build expense data object
    const expenseData: any = {
      issue_date: context.propsValue.issueDate,
      currency: context.propsValue.currency,
      contact: contactData,
      items: itemsData,
      payment_method: context.propsValue.paymentMethod,
      country: context.propsValue.country,
    };

    if (context.propsValue.poNumber) {
      expenseData.po_number = context.propsValue.poNumber;
    }
    if (context.propsValue.tagList) {
      expenseData.tag_list = context.propsValue.tagList.split(',').map((tag) => tag.trim());
    }
    if (context.propsValue.notes) {
      expenseData.notes = context.propsValue.notes;
    }

    return await makeRequest(
      context.auth.props.account_name,
      context.auth.props.api_key,
      HttpMethod.POST,
      '/expenses',
      expenseData
    );
  },
});
