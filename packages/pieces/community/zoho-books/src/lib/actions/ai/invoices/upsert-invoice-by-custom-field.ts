import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const upsertInvoiceByCustomFieldAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_upsert_invoice_by_custom_field',
  displayName: 'Upsert Invoice by Custom Field',
  description:
    'Updates the invoice matching a unique custom field value in Zoho Books, or creates one.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Finds the invoice whose unique custom field (one set to reject duplicate values) has the given value and updates it with the fields given. With Create If Missing set to Yes, creates the invoice when none matches, which then needs Customer ID and Line Items.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    uniqueIdentifierKey: Property.ShortText({
      displayName: 'Unique Custom Field API Name',
      description:
        'API name of an invoice custom field that rejects duplicate values, e.g. "cf_order_ref".',
      required: true,
    }),
    uniqueIdentifierValue: Property.ShortText({
      displayName: 'Unique Custom Field Value',
      description: 'Value of that custom field identifying the invoice.',
      required: true,
    }),
    createIfMissing: zohoBooksAiProps.flag({
      required: false,
      displayName: 'Create If Missing',
      description:
        'Yes to create a new invoice when no invoice has this value. Defaults to No (update only).',
    }),
    customerId: zohoBooksAiProps.contactId({
      required: false,
      displayName: 'Customer ID',
      description: 'Contact ID of the customer, from List Contacts or Create Contact.',
    }),
    lineItems: Property.Json({
      displayName: 'Line Items',
      description:
        'Array of line items, replacing the current ones on an update; needed when creating. item_id or name is needed on each, e.g. [{"item_id": "982000000030049", "name": "Laptop", "description": "15 inch, 16 GB RAM", "rate": 1200, "quantity": 2, "tax_id": "982000000557028", "discount": "10%"}]. tax_id comes from the Zoho Books taxes settings; discount is an amount or a percentage.',
      required: false,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Invoice date, yyyy-mm-dd. Defaults to today on create.',
      required: false,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date, yyyy-mm-dd. Defaults to the date plus the payment terms.',
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
        'Custom invoice number, e.g. "INV-00003". Leave empty to keep the current number or use the next automatic number.',
      required: false,
    }),
    referenceNumber: Property.ShortText({
      displayName: 'Reference Number',
      description: 'External reference such as a purchase order number.',
      required: false,
    }),
    currencyId: Property.ShortText({
      displayName: 'Currency ID',
      description: 'Currency ID of the invoice. Defaults to the currency of the customer.',
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
        'Other invoice fields, e.g. {"payment_terms_label": "Net 15", "template_id": "...", "location_id": "...", "exchange_rate": 1, "is_inclusive_tax": false, "shipping_charge": "25.00", "adjustment": -2, "adjustment_description": "Rounding", "allow_partial_payments": true, "contact_persons_associated": [{"contact_person_id": "..."}], "custom_fields": [{"api_name": "cf_po", "value": "..."}], "tags": [{"tag_id": "...", "tag_option_id": "..."}], "place_of_supply": "TN", "gst_treatment": "business_gst"}. The props above win over the same keys here.',
    }),
  },
  async run(context) {
    const {
      uniqueIdentifierKey,
      uniqueIdentifierValue,
      createIfMissing,
      customerId,
      lineItems,
      date,
      dueDate,
      paymentTerms,
      invoiceNumber,
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
      path: '/invoices',
      query: { organization_id: organizationId },
      headers: {
        'X-Unique-Identifier-Key': uniqueIdentifierKey,
        'X-Unique-Identifier-Value': uniqueIdentifierValue,
        ...spreadIfDefined('X-Upsert', createIfMissing),
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
