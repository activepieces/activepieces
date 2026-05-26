import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wafeqAuth } from '../common/auth';
import { wafeqApiCall, WafeqPaginatedResponse } from '../common/client';
import { wafeqHelpers } from '../common/helpers';

export const findContact = createAction({
  auth: wafeqAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description:
    'Search your Wafeq contacts by name, email, phone, or tax number. Useful for checking if a customer already exists before creating a new one.',
  props: {
    keyword: Property.ShortText({
      displayName: 'Search For',
      description:
        'Type what you\'re looking for — part of a name, email, phone number, or tax number works. Leave blank to list all contacts.',
      required: false,
    }),
    relationship: Property.StaticDropdown({
      displayName: 'Type of Contact',
      description: 'Only show customers, only suppliers, or both.',
      required: false,
      options: {
        options: [
          { label: 'Any', value: '' },
          { label: 'Customer', value: 'CUSTOMER' },
          { label: 'Supplier', value: 'SUPPLIER' },
        ],
      },
    }),
    external_id: Property.ShortText({
      displayName: 'Your Reference ID (optional)',
      description:
        'If you stored a reference ID when creating the contact (e.g. your CRM\'s customer ID), enter it here for an exact match.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Max Results',
      description: 'How many contacts to return at most. Default is 50, maximum is 200.',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const queryParams = wafeqHelpers.stripEmpty({
      keyword: p.keyword,
      relationship: p.relationship,
      external_id: p.external_id,
      page_size: String(Math.min(Math.max(p.limit ?? 50, 1), 200)),
    }) as Record<string, string>;
    const response = await wafeqApiCall<WafeqPaginatedResponse<ContactListResponseItem>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/contacts/',
      queryParams,
    });
    return {
      total: response.body.count,
      returned: response.body.results.length,
      results: response.body.results.map(flattenContact),
    };
  },
});

function flattenContact(c: ContactListResponseItem): Record<string, unknown> {
  return {
    id: c.id,
    name: c.name,
    email: c.email ?? null,
    phone: c.phone ?? null,
    country: c.country ?? null,
    city: c.city ?? null,
    tax_registration_number: c.tax_registration_number ?? null,
    relationship: Array.isArray(c.relationship) ? c.relationship.join(', ') : null,
    external_id: c.external_id ?? null,
    created_ts: c.created_ts ?? null,
    modified_ts: c.modified_ts ?? null,
  };
}

type ContactListResponseItem = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  tax_registration_number?: string;
  relationship?: string[];
  external_id?: string;
  created_ts?: string;
  modified_ts?: string;
};
