import { teamleaderAuth } from '../common/auth';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  PiecePropValueSchema,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { teamleaderCommon } from '../common/client';

const polling: Polling<
  PiecePropValueSchema<typeof teamleaderAuth>,
  { invoiceStatus: string, includeDetailedInfo: boolean }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    // Prepare query parameters with sorting to get newest first
    const queryParams: Record<string, any> = {
      'sort': '-updated_at',
      'page[size]': '100' // Maximum allowed by API
    };

    // Add filter by status if specified
    if (propsValue.invoiceStatus && propsValue.invoiceStatus !== 'all') {
      queryParams['filter[status]'] = propsValue.invoiceStatus;
    }

    // If lastItemId exists, add it to the query parameters to only get invoices after that ID
    if (lastItemId) {
      queryParams['filter[id][gt]'] = lastItemId;
    }

    // Call the Teamleader API to get invoices
    const response = await teamleaderCommon.apiCall({
      auth: auth,
      method: HttpMethod.GET,
      resourceUri: '/invoices.list',
      queryParams
    });

    // Map the response data to the expected format
    const invoices = response.body.data;
    
    // If includeDetailedInfo is true and we have invoices,
    // fetch the full invoice details
    if (propsValue.includeDetailedInfo && invoices.length > 0) {
      const detailedInvoices = [];
      
      for (const invoice of invoices) {
        try {
          const detailedInfo = await teamleaderCommon.apiCall({
            auth: auth,
            method: HttpMethod.GET,
            resourceUri: '/invoices.info',
            queryParams: {
              id: invoice.id
            }
          });
          
          detailedInvoices.push({
            id: invoice.id,
            data: detailedInfo.body.data
          });
        } catch (error) {
          // If fetching details fails, use the basic invoice info
          detailedInvoices.push({
            id: invoice.id,
            data: invoice
          });
        }
      }
      
      return detailedInvoices;
    }
    
    // Return basic invoice information
    return invoices.map((invoice: any) => ({
      id: invoice.id,
      data: invoice
    }));
  },
};

export const newInvoice = createTrigger({
  name: 'new_invoice',
  displayName: 'New Invoice (Status)',
  description: 'Triggers when an invoice is created, booked, sent, or paid in Teamleader',
  auth: teamleaderAuth,
  type: TriggerStrategy.POLLING,
  props: {
    invoiceStatus: Property.StaticDropdown({
      displayName: 'Invoice Status',
      description: 'The status of the invoice to trigger on',
      required: true,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All Statuses', value: 'all' },
          { label: 'Draft', value: 'draft' },
          { label: 'Booked', value: 'booked' },
          { label: 'Sent', value: 'sent' },
          { label: 'Paid', value: 'paid' },
          { label: 'Overdue', value: 'overdue' }
        ]
      }
    }),
    includeDetailedInfo: Property.Checkbox({
      displayName: 'Include Detailed Information',
      description: 'Include detailed information for the invoices (line items, payment details, etc.)',
      required: false,
      defaultValue: true
    })
  },
  sampleData: {
    id: '87654321-abcd-1234-5678-1234567890ef',
    department: {
      type: 'department',
      id: '45985439-58ce-02df-2542-9dfe87ee1a39'
    },
    invoice_number: 'INV-2025-012',
    invoice_date: '2025-07-26',
    status: 'paid',
    due_on: '2025-08-25',
    paid_at: '2025-07-28',
    invoicee: {
      type: 'company',
      id: '87654321-abcd-1234-5678-1234567890cd'
    },
    total: {
      tax_exclusive: {
        amount: 2500.00,
        currency: 'EUR'
      },
      tax_inclusive: {
        amount: 3025.00,
        currency: 'EUR'
      },
      taxes: [
        {
          rate: 21.00,
          taxable: {
            amount: 2500.00,
            currency: 'EUR'
          },
          tax: {
            amount: 525.00,
            currency: 'EUR'
          }
        }
      ]
    },
    items: [
      {
        product: {
          type: 'product',
          id: '12345678-abcd-1234-5678-1234567890ab'
        },
        quantity: 5,
        description: 'Premium Support Package (Monthly)',
        unit_price: {
          amount: 500.00,
          currency: 'EUR'
        },
        tax_rate: {
          rate: 21.00
        },
        total: {
          tax_exclusive: {
            amount: 2500.00,
            currency: 'EUR'
          },
          tax_inclusive: {
            amount: 3025.00,
            currency: 'EUR'
          }
        }
      }
    ],
    payment_reference: 'REF123456',
    created_at: '2025-07-26T09:30:15+00:00',
    updated_at: '2025-07-28T14:15:22+00:00'
  },
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {
        invoiceStatus: context.propsValue.invoiceStatus ?? 'all',
        includeDetailedInfo: context.propsValue.includeDetailedInfo ?? true
      }
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {
        invoiceStatus: context.propsValue.invoiceStatus ?? 'all',
        includeDetailedInfo: context.propsValue.includeDetailedInfo ?? true
      }
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {
        invoiceStatus: context.propsValue.invoiceStatus ?? 'all',
        includeDetailedInfo: context.propsValue.includeDetailedInfo ?? true
      },
      files: context.files
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {
        invoiceStatus: context.propsValue.invoiceStatus ?? 'all',
        includeDetailedInfo: context.propsValue.includeDetailedInfo ?? true
      },
      files: context.files
    });
  },
});
