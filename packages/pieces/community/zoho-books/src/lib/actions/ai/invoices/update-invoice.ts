import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const updateInvoiceAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_invoice',
  displayName: 'Update Invoice',
  description: 'Updates an invoice in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates an invoice; only the fields given are sent. Line Items, when given, replaces every line: include the line_item_id from Get Invoice for each line to keep, and leave out the lines to remove.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    customerId: zohoBooksAiProps.contactId({
      required: false,
      displayName: 'Customer ID',
      description: 'Contact ID of the customer, from List Contacts or Create Contact.',
    }),
    lineItems: Property.Json({
      displayName: 'Line Items',
      description:
        'Full list of line items, replacing the current ones, e.g. [{"line_item_id": "982000000567021", "item_id": "982000000030049", "name": "Laptop", "description": "15 inch, 16 GB RAM", "rate": 1200, "quantity": 2, "tax_id": "982000000557028", "discount": "10%"}]. Keep line_item_id (from Get Invoice) on existing lines; omit it for new lines.',
      required: false,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Invoice date, yyyy-mm-dd.',
      required: false,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date, yyyy-mm-dd.',
      required: false,
    }),
    paymentTerms: Property.Number({
      displayName: 'Payment Terms',
      description: 'Days allowed for payment after the invoice date, e.g. 15.',
      required: false,
    }),
    invoiceNumber: Property.ShortText({
      displayName: 'Invoice Number',
      description:
        'Custom invoice number, e.g. "INV-00003". Needs Ignore Auto Number Generation set to Yes.',
      required: false,
    }),
    ignoreAutoNumberGeneration: zohoBooksAiProps.flag({
      required: false,
      displayName: 'Ignore Auto Number Generation',
      description: 'Yes to use the Invoice Number given instead of the next automatic number.',
    }),
    referenceNumber: Property.ShortText({
      displayName: 'Reference Number',
      description: 'External reference such as a purchase order number.',
      required: false,
    }),
    currencyId: Property.ShortText({
      displayName: 'Currency ID',
      description: 'Currency ID of the invoice.',
      required: false,
    }),
    discount: Property.ShortText({
      displayName: 'Discount',
      description:
        'Invoice-level discount, a flat amount (e.g. "50") or a percentage (e.g. "10%").',
      required: false,
    }),
    isDiscountBeforeTax: zohoBooksAiProps.flag({
      required: false,
      displayName: 'Discount Before Tax',
      description: 'Yes to apply the discount before tax, No to apply it after tax.',
    }),
    salespersonName: Property.ShortText({ displayName: 'Salesperson Name', required: false }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Notes shown on the invoice, e.g. a thank-you message.',
      required: false,
    }),
    terms: Property.LongText({
      displayName: 'Terms',
      description: 'Terms and conditions shown on the invoice.',
      required: false,
    }),
    additionalFields: zohoBooksAiProps.additionalFields({
      description:
        'Other invoice fields to change, e.g. {"payment_terms_label": "Net 15", "template_id": "...", "location_id": "...", "exchange_rate": 1, "is_inclusive_tax": false, "shipping_charge": "25.00", "adjustment": -2, "adjustment_description": "Rounding", "allow_partial_payments": true, "contact_persons_associated": [{"contact_person_id": "..."}], "custom_fields": [{"api_name": "cf_po", "value": "..."}], "tags": [{"tag_id": "...", "tag_option_id": "..."}], "place_of_supply": "TN", "gst_treatment": "business_gst"}. The props above win over the same keys here.',
    }),
  },
  async run(context) {
    const {
      invoiceId,
      customerId,
      lineItems,
      date,
      dueDate,
      paymentTerms,
      invoiceNumber,
      ignoreAutoNumberGeneration,
      referenceNumber,
      currencyId,
      discount,
      isDiscountBeforeTax,
      salespersonName,
      notes,
      terms,
      additionalFields,
    } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/invoices/${encodeURIComponent(invoiceId)}`,
      query: {
        organization_id: organizationId,
        ignore_auto_number_generation: ignoreAutoNumberGeneration,
      },
      body: {
        ...additionalFields,
        ...spreadIfDefined('customer_id', customerId),
        ...spreadIfDefined('line_items', lineItems),
        ...spreadIfDefined('date', date),
        ...spreadIfDefined('due_date', dueDate),
        ...spreadIfDefined('payment_terms', paymentTerms),
        ...spreadIfDefined('invoice_number', invoiceNumber),
        ...spreadIfDefined('reference_number', referenceNumber),
        ...spreadIfDefined('currency_id', currencyId),
        ...spreadIfDefined('discount', discount),
        ...spreadIfDefined(
          'is_discount_before_tax',
          zohoBooksUtils.toBoolean({ value: isDiscountBeforeTax }),
        ),
        ...spreadIfDefined('salesperson_name', salespersonName),
        ...spreadIfDefined('notes', notes),
        ...spreadIfDefined('terms', terms),
      },
    });
  },
});
