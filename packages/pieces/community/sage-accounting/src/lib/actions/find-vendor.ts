import { createAction, Property } from '@activepieces/pieces-framework';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient } from '../client';
import { findVendorActionOutputSchema } from '../output-schemas';

export const findVendorAction = createAction({
  auth: sageAccountingAuth,
  name: 'find_vendor',
  classification: 'SEARCH',
  displayName: 'Find Vendor',
  description: 'Searches for vendor contacts in Sage Accounting by name or reference.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Sage Accounting vendor contacts by name or reference (partial match). Returns zero or more matches. Read-only, safe to retry.',
    idempotent: true,
  },
  outputSchema: findVendorActionOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Name or Reference contains',
      description: 'Filter by vendor name or reference, e.g. "Acme".',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max results',
      required: false,
      defaultValue: 10,
      display: 'stepper',
      min: 1,
      max: 200,
    }),
  },
  async run(context) {
    const { search, maxResults } = context.propsValue;
    const { items } = await sageAccountingClient.list<Record<string, unknown>>({
      accessToken: context.auth.access_token,
      path: sageAccountingClient.paths.contacts,
      query: {
        contact_type_id: sageAccountingClient.contactTypes.vendor,
        ...(search ? { search } : {}),
        nested_attributes: 'all',
        items_per_page: String(maxResults ?? 10),
      },
    });

    return items;
  },
});
