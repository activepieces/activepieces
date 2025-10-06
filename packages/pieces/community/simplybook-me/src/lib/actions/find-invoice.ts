import { createAction, Property } from '@activepieces/pieces-framework';
import { simplybookAuth } from '../../index';
import { SimplyBookClient } from '../common/client';
import { InvoiceQuery, InvoiceQuerySchema } from '../common/types';
import { createDropdownOptions } from '../common/index';

export const findInvoice = createAction({
  auth: simplybookAuth,
  name: 'find_invoice',
  displayName: 'Find Invoice',
  description: 'Search for invoices in SimplyBook.me',
  props: {
    bookingId: Property.Dropdown({
      displayName: 'Booking',
      description: 'Filter by booking (optional)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => createDropdownOptions.bookings(auth),
    }),
    status: Property.StaticDropdown({
      displayName: 'Invoice Status',
      description: 'Filter by invoice status',
      required: false,
      options: {
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Paid', value: 'paid' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Overdue', value: 'overdue' },
        ],
      },
    }),
  },
  async run(context) {
    const { bookingId, status } = context.propsValue;
    const { companyLogin, apiKey, baseUrl } = context.auth;

    const query: InvoiceQuery = {
      booking_id: bookingId,
      status,
    };

    const validatedQuery = InvoiceQuerySchema.parse(query);

    const client = new SimplyBookClient({
      companyLogin,
      apiKey,
      baseUrl,
    });

    try {
      const invoice = await client.findInvoice(validatedQuery);
      return {
        success: true,
        invoice,
        found: invoice !== null,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
