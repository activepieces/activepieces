import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wafeqAuth } from '../common/auth';
import { wafeqApiCall } from '../common/client';
import { wafeqProps } from '../common/props';
import { wafeqHelpers } from '../common/helpers';

export const createContact = createAction({
  auth: wafeqAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description:
    'Add a new customer or supplier to your Wafeq address book so you can invoice them or record bills from them.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description:
        'The business name (for companies) or full name (for individuals). This is what appears on invoices and bills.',
      required: true,
    }),
    relationship: Property.StaticMultiSelectDropdown({
      displayName: 'Type of Contact',
      description:
        'Pick "Customer" if you sell to them, "Supplier" if you buy from them, or both if they\'re on both sides.',
      required: true,
      defaultValue: ['CUSTOMER'],
      options: {
        options: [
          { label: 'Customer (I sell to them)', value: 'CUSTOMER' },
          { label: 'Supplier (I buy from them)', value: 'SUPPLIER' },
        ],
      },
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description:
        'Where to send invoices and other documents. Optional but recommended — Wafeq can email invoices directly.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Main phone number.',
      required: false,
    }),
    tax_registration_number: Property.ShortText({
      displayName: 'VAT / Tax Number',
      description:
        'The contact\'s VAT registration number (also called TRN in UAE, TIN in some countries). Required for tax-compliant B2B invoices — leave blank for individuals.',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country Code',
      description:
        'Two-letter ISO country code: AE = UAE, SA = Saudi Arabia, US = United States, GB = UK, etc.',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'The city name.',
      required: false,
    }),
    address: Property.LongText({
      displayName: 'Street Address',
      description: 'Street / building address. This appears on printed invoices.',
      required: false,
    }),
    postal_code: Property.ShortText({
      displayName: 'Postal / ZIP Code',
      description:
        'The postal code. Must be exactly 5 digits for Saudi Arabia addresses.',
      required: false,
    }),
    external_id: wafeqProps.externalId('Your Customer ID'),
    idempotency_key: wafeqProps.idempotencyKey,
  },
  async run(context) {
    const p = context.propsValue;
    const body = wafeqHelpers.stripEmpty({
      name: p.name,
      relationship: p.relationship,
      email: p.email,
      phone: p.phone,
      tax_registration_number: p.tax_registration_number,
      country: p.country,
      city: p.city,
      address: p.address,
      postal_code: p.postal_code,
      external_id: p.external_id,
    });
    const response = await wafeqApiCall<ContactResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/contacts/',
      body,
      idempotencyKey: p.idempotency_key as string | undefined,
    });
    return flattenContact(response.body);
  },
});

function flattenContact(c: ContactResponse): Record<string, unknown> {
  return {
    id: c.id,
    name: c.name,
    email: c.email ?? null,
    phone: c.phone ?? null,
    country: c.country ?? null,
    city: c.city ?? null,
    address: c.address ?? null,
    postal_code: c.postal_code ?? null,
    tax_registration_number: c.tax_registration_number ?? null,
    relationship: Array.isArray(c.relationship) ? c.relationship.join(', ') : null,
    external_id: c.external_id ?? null,
    created_ts: c.created_ts ?? null,
    modified_ts: c.modified_ts ?? null,
  };
}

type ContactResponse = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  tax_registration_number?: string;
  relationship?: string[];
  external_id?: string;
  created_ts?: string;
  modified_ts?: string;
};
