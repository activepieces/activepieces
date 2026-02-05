import { createAction, Property } from '@activepieces/pieces-framework';
import { bokioAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getDraftInvoiceByCustomerName = createAction({
  auth: bokioAuth,
  name: 'getDraftInvoiceByCustomerName',
  displayName: 'Get Draft Invoice by Customer Name',
  description: 'Get all draft invoices for a customer by customer name',
  props: {
    customerName: Property.ShortText({
      displayName: 'Customer Name',
      description: 'Name of the customer to find draft invoices for',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number (defaults to 1)',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of items per page (max 100, defaults to 25)',
      required: false,
    }),
  },
  async run(context) {
    const { customerName, page, pageSize } = context.propsValue;
    const { api_key, companyId } = context.auth.props;

    // First, find the customer by name
    const customerSearchParams = new URLSearchParams();
    customerSearchParams.append('page', '1');
    customerSearchParams.append('pageSize', '100');
    customerSearchParams.append('query', `name=='${customerName}'`);

    const customerUrl = `/companies/${companyId}/customers?${customerSearchParams.toString()}`;
    const customerResponse = await makeRequest(api_key, HttpMethod.GET, customerUrl);

    if (!customerResponse.items || customerResponse.items.length === 0) {
      return {
        message: `No customer found with name: ${customerName}`,
        items: [],
      };
    }

    const customerId = customerResponse.items[0].id;

    // Now fetch draft invoices for this customer
    const invoiceParams = new URLSearchParams();
    if (page !== undefined && page !== null) {
      invoiceParams.append('page', String(page));
    } else {
      invoiceParams.append('page', '1');
    }

    if (pageSize !== undefined && pageSize !== null) {
      invoiceParams.append('pageSize', String(pageSize));
    } else {
      invoiceParams.append('pageSize', '25');
    }

    // Filter for draft invoices with matching customer
    invoiceParams.append('query', `status==draft&&customerRef==${customerId}`);

    const invoiceUrl = `/companies/${companyId}/invoices?${invoiceParams.toString()}`;
    const invoiceResponse = await makeRequest(api_key, HttpMethod.GET, invoiceUrl);

    return {
      customerName: customerResponse.items[0].name,
      customerId,
      ...invoiceResponse,
    };
  },
});
