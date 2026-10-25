import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

const FILTER_BY = [
  'PaymentMode.All',
  'PaymentMode.Check',
  'PaymentMode.Cash',
  'PaymentMode.BankTransfer',
  'PaymentMode.Paypal',
  'PaymentMode.CreditCard',
  'PaymentMode.GoogleCheckout',
  'PaymentMode.Credit',
  'PaymentMode.Authorizenet',
  'PaymentMode.BankRemittance',
  'PaymentMode.Payflowpro',
  'PaymentMode.Stripe',
  'PaymentMode.TwoCheckout',
  'PaymentMode.Braintree',
  'PaymentMode.Others',
];

export const listCustomerPaymentsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_list_customer_payments',
  displayName: 'List Customer Payments',
  description: 'Lists payments received from customers in Zoho Books, with filters.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists customer payments with their payment_id, filtered by customer, reference number, date, amount, payment mode or free text. Returns one page; page_context.has_more_page tells whether to fetch the next page.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    customerId: zohoBooksAiProps.contactId({
      required: false,
      displayName: 'Customer ID',
      description: 'Contact ID of the customer, from List Contacts.',
    }),
    customerName: Property.ShortText({
      displayName: 'Customer Name',
      description: 'Exact customer name.',
      required: false,
    }),
    customerNameContains: Property.ShortText({
      displayName: 'Customer Name Contains',
      description: 'Part of the customer name.',
      required: false,
    }),
    referenceNumber: Property.ShortText({
      displayName: 'Reference Number',
      description: 'Exact reference number.',
      required: false,
    }),
    referenceNumberContains: Property.ShortText({
      displayName: 'Reference Number Contains',
      description: 'Part of the reference number.',
      required: false,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Payment date, yyyy-mm-dd.',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Exact payment amount.',
      required: false,
    }),
    amountGreaterThan: Property.Number({ displayName: 'Amount Greater Than', required: false }),
    amountLessThan: Property.Number({ displayName: 'Amount Less Than', required: false }),
    paymentMode: Property.ShortText({
      displayName: 'Payment Mode',
      description: 'Exact payment mode, e.g. "cash".',
      required: false,
    }),
    notesContains: Property.ShortText({
      displayName: 'Notes Contains',
      description: 'Part of the customer notes.',
      required: false,
    }),
    searchText: Property.ShortText({
      displayName: 'Search Text',
      description: 'Searches reference number, customer name and payment description.',
      required: false,
    }),
    filterBy: Property.StaticDropdown({
      displayName: 'Filter By',
      description: 'Payment mode filter. Defaults to PaymentMode.All.',
      required: false,
      options: { options: FILTER_BY.map((value) => ({ label: value, value })) },
    }),
    sortColumn: Property.ShortText({
      displayName: 'Sort Column',
      description: 'Column to sort by, e.g. "date" or "created_time".',
      required: false,
    }),
    page: zohoBooksAiProps.page(),
    perPage: zohoBooksAiProps.perPage(),
  },
  async run(context) {
    const {
      customerId,
      customerName,
      customerNameContains,
      referenceNumber,
      referenceNumberContains,
      date,
      amount,
      amountGreaterThan,
      amountLessThan,
      paymentMode,
      notesContains,
      searchText,
      filterBy,
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
      path: '/customerpayments',
      query: {
        organization_id: organizationId,
        customer_id: customerId,
        customer_name: customerName,
        customer_name_contains: customerNameContains,
        reference_number: referenceNumber,
        reference_number_contains: referenceNumberContains,
        date,
        amount,
        amount_greater_than: amountGreaterThan,
        amount_less_than: amountLessThan,
        payment_mode: paymentMode,
        notes_contains: notesContains,
        search_text: searchText,
        filter_by: filterBy,
        sort_column: sortColumn,
        ...zohoBooksUtils.pageQuery({ page, perPage }),
      },
    });
  },
});
