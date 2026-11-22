import { createAction, Property } from '@activepieces/pieces-framework';
import { bokioAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioClient } from '../common/client';
import { bokioSchemas } from '../common/schemas';

export const getDraftInvoiceByCustomerName = createAction({
  auth: bokioAuth,
  name: 'getDraftInvoiceByCustomerName',
  classification: 'SEARCH',
  displayName: 'Get Draft Invoice by Customer Name',
  description: 'Get all draft invoices for a customer by customer name',
  audience: 'both',
  aiMetadata: { description: 'Finds the Bokio customer whose name exactly equals the given name (case-sensitive) and returns that customer\'s draft invoices, one page at a time. Returns found=false with no items when no customer has that exact name, and fails if several customers share the name (then use List Invoices with a customer ID). Read-only.', idempotent: true },
  outputSchema: bokioSchemas.draftInvoicesByCustomer,
  props: {
    customerName: Property.ShortText({
      displayName: 'Customer Name',
      description: 'Exact customer name (case-sensitive)',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number (defaults to 1)',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Results per page, 1 to 100 (defaults to 25)',
      required: false,
    }),
  },
  async run(context) {
    const { customerName, page, pageSize } = context.propsValue;
    const name = customerName.trim();
    const auth = context.auth.props;
    const customerBody = await bokioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: '/customers',
      operation: 'find customer',
      queryParams: bokioClient.listParams({
        page: 1,
        pageSize: 100,
        query: bokioClient.buildFilter([{ field: 'name', operator: '==', value: name }]),
      }),
    });
    const matches = bokioClient
      .normalizePage<unknown>(customerBody)
      .items.filter(
        (customer): customer is Record<string, unknown> =>
          bokioClient.isRecord(customer) &&
          typeof customer['id'] === 'string' &&
          customer['name'] === name
      );
    if (matches.length === 0) {
      return {
        found: false,
        customerId: null,
        customerName: name,
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      };
    }
    if (matches.length > 1) {
      throw new Error(
        `Several Bokio customers are named "${name}" (ids: ${matches
          .map((customer) => String(customer['id']))
          .join(', ')}). Use List Invoices with a customer ID instead.`
      );
    }
    const customerId = String(matches[0]['id']);
    const invoiceBody = await bokioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: '/invoices',
      operation: 'list draft invoices',
      queryParams: bokioClient.listParams({
        page,
        pageSize,
        query: bokioClient.buildFilter([
          { field: 'status', operator: '==', value: 'draft' },
          { field: 'customerRef.id', operator: '==', value: customerId },
        ]),
      }),
    });
    return {
      found: true,
      customerId,
      customerName: name,
      ...bokioClient.normalizePage<unknown>(invoiceBody),
    };
  },
});
