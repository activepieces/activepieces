import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

const STATUSES = ['sent', 'draft', 'overdue', 'paid', 'void', 'unpaid', 'partially_paid', 'viewed'];

const SORT_COLUMNS = [
  'customer_name',
  'invoice_number',
  'date',
  'due_date',
  'total',
  'balance',
  'created_time',
];

export const listInvoicesAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_list_invoices',
  displayName: 'List Invoices',
  description: 'Lists Zoho Books invoices, with filters.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists invoices with their invoice_id, filtered by customer, status, number, reference, dates, item or free text. Returns one page; page_context.has_more_page tells whether to fetch the next page.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    customerId: zohoBooksAiProps.contactId({
      required: false,
      displayName: 'Customer ID',
      description: 'Contact ID of the customer, from List Contacts or Create Contact.',
    }),
    customerName: Property.ShortText({ displayName: 'Customer Name', required: false }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email of the customer or contact person.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: { options: STATUSES.map((value) => ({ label: value, value })) },
    }),
    filterBy: Property.ShortText({
      displayName: 'Filter By',
      description:
        'Advanced status or date filter, e.g. "Status.All", "Status.Sent", "Status.Draft", "Status.OverDue", "Status.Paid", "Status.Void", "Status.Unpaid", "Status.PartiallyPaid" or "Date.PaymentExpectedDate".',
      required: false,
    }),
    invoiceNumber: Property.ShortText({
      displayName: 'Invoice Number',
      description: 'Exact invoice number, e.g. "INV-00003".',
      required: false,
    }),
    referenceNumber: Property.ShortText({
      displayName: 'Reference Number',
      description: 'External reference such as a purchase order number.',
      required: false,
    }),
    searchText: Property.ShortText({
      displayName: 'Search Text',
      description: 'Searches invoice number, purchase order and customer name.',
      required: false,
    }),
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'Only invoices with a line item for this item.',
      required: false,
    }),
    itemName: Property.ShortText({
      displayName: 'Item Name',
      description: 'Only invoices with a line item of this name.',
      required: false,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Exact invoice date, yyyy-mm-dd.',
      required: false,
    }),
    dateStart: Property.ShortText({
      displayName: 'Date From',
      description: 'Invoice date on or after, yyyy-mm-dd.',
      required: false,
    }),
    dateEnd: Property.ShortText({
      displayName: 'Date To',
      description: 'Invoice date on or before, yyyy-mm-dd.',
      required: false,
    }),
    dueDateStart: Property.ShortText({
      displayName: 'Due Date From',
      description: 'Due date on or after, yyyy-mm-dd.',
      required: false,
    }),
    dueDateEnd: Property.ShortText({
      displayName: 'Due Date To',
      description: 'Due date on or before, yyyy-mm-dd.',
      required: false,
    }),
    lastModifiedTime: Property.ShortText({
      displayName: 'Modified After',
      description: 'Only invoices modified after this time, e.g. "2023-11-18T02:02:51-0800".',
      required: false,
    }),
    sortColumn: Property.StaticDropdown({
      displayName: 'Sort Column',
      required: false,
      options: { options: SORT_COLUMNS.map((value) => ({ label: value, value })) },
    }),
    page: zohoBooksAiProps.page(),
    perPage: zohoBooksAiProps.perPage(),
  },
  async run(context) {
    const {
      customerId,
      customerName,
      email,
      status,
      filterBy,
      invoiceNumber,
      referenceNumber,
      searchText,
      itemId,
      itemName,
      date,
      dateStart,
      dateEnd,
      dueDateStart,
      dueDateEnd,
      lastModifiedTime,
      sortColumn,
      page,
      perPage,
    } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/invoices',
      query: {
        organization_id: organizationId,
        customer_id: customerId,
        customer_name: customerName,
        email,
        status,
        filter_by: filterBy,
        invoice_number: invoiceNumber,
        reference_number: referenceNumber,
        search_text: searchText,
        item_id: itemId,
        item_name: itemName,
        date,
        date_start: dateStart,
        date_end: dateEnd,
        due_date_start: dueDateStart,
        due_date_end: dueDateEnd,
        last_modified_time: lastModifiedTime,
        sort_column: sortColumn,
        ...zohoBooksUtils.pageQuery({ page, perPage }),
      },
    });
  },
});
