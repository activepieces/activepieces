import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplybookAuth, getAccessToken, SimplybookAuth, clientDropdown } from '../common';

export const findInvoice = createAction({
  auth: simplybookAuth,
  name: 'find_invoice',
  displayName: 'Find Invoice',
  description: 'Find invoices with filters and pagination',
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number in the list',
      required: false,
      defaultValue: 1
    }),
    onPage: Property.Number({
      displayName: 'Items Per Page',
      description: 'Number of items per page',
      required: false,
      defaultValue: 25
    }),
    clientId: Property.Dropdown({
      auth: simplybookAuth,
      displayName: 'Client',
      description: 'Filter by client (optional)',
      required: false,
      refreshers: [],
      options: clientDropdown.options
    }),
    datetimeFrom: Property.ShortText({
      displayName: 'Date Time From',
      description: 'Order/invoice date and time from (format: YYYY-MM-DD HH:MM:SS)',
      required: false
    }),
    datetimeTo: Property.ShortText({
      displayName: 'Date Time To',
      description: 'Order/invoice date and time to (format: YYYY-MM-DD HH:MM:SS)',
      required: false
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'Order/invoice status',
      required: false
    }),
    bookingCode: Property.ShortText({
      displayName: 'Booking Code',
      description: 'Filter by booking code',
      required: false
    })
  },
  async run(context) {
    const auth = context.auth.props;
    const accessToken = await getAccessToken(auth);

    // Build query parameters
    const queryParams: string[] = [];

    // Pagination
    if (context.propsValue.page) {
      queryParams.push(`page=${context.propsValue.page}`);
    }
    if (context.propsValue.onPage) {
      queryParams.push(`on_page=${context.propsValue.onPage}`);
    }

    // Filters
    if (context.propsValue.clientId) {
      queryParams.push(`filter[client_id]=${context.propsValue.clientId}`);
    }
    if (context.propsValue.datetimeFrom) {
      queryParams.push(`filter[datetime_from]=${encodeURIComponent(context.propsValue.datetimeFrom)}`);
    }
    if (context.propsValue.datetimeTo) {
      queryParams.push(`filter[datetime_to]=${encodeURIComponent(context.propsValue.datetimeTo)}`);
    }
    if (context.propsValue.status) {
      queryParams.push(`filter[status]=${encodeURIComponent(context.propsValue.status)}`);
    }
    if (context.propsValue.bookingCode) {
      queryParams.push(`filter[booking_code]=${encodeURIComponent(context.propsValue.bookingCode)}`);
    }

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://user-api-v2.simplybook.me/admin/invoices${queryString}`,
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': auth.companyLogin,
          'X-Token': accessToken
        }
      });

      return response.body;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to find invoices: ${error.response.status} - ${JSON.stringify(error.response.body)}`
        );
      }
      throw new Error(`Failed to find invoices: ${error.message}`);
    }
  }
});
