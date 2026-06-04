import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { qawafelAuth } from '../common/auth';
import { qawafelApiCall } from '../common/client';
import { qawafelProps } from '../common/props';

export const createMerchant = createAction({
  auth: qawafelAuth,
  name: 'create_merchant',
  displayName: 'Create Merchant (Customer or Supplier)',
  description:
    'Add a new customer or supplier to your Qawafel tenant. Use this when onboarding a new B2B partner from your CRM, signup form, or another system.',
  props: {
    type: Property.StaticDropdown<'customer' | 'supplier'>({
      displayName: 'Merchant Type',
      description:
        'Pick **Customer** if this party buys from you, or **Supplier** if you buy from them.',
      required: true,
      defaultValue: 'customer',
      options: {
        disabled: false,
        options: [
          { label: 'Customer (buys from you)', value: 'customer' },
          { label: 'Supplier (you buy from them)', value: 'supplier' },
        ],
      },
    }),
    legal_name: Property.ShortText({
      displayName: 'Legal Name',
      description:
        'The official registered company name as it appears on the commercial registration.',
      required: true,
    }),
    name_en: Property.ShortText({
      displayName: 'Trade Name (English)',
      description:
        'The trade or store name in English. Shown on documents and dashboards.',
      required: true,
    }),
    name_ar: Property.ShortText({
      displayName: 'Trade Name (Arabic)',
      description:
        'The trade or store name in Arabic. Required by Qawafel for ZATCA-compliant invoices.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Primary contact email for this merchant.',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description:
        'Primary phone number, including country code (e.g. `+966500000000`).',
      required: true,
    }),
    cr_number: Property.ShortText({
      displayName: 'Commercial Registration (CR) Number',
      description: '10-digit Saudi Commercial Registration number.',
      required: true,
    }),
    vat_number: Property.ShortText({
      displayName: 'VAT Number',
      description:
        'Optional. 15-digit VAT registration number, starts with `3`. Required if the merchant is VAT-registered.',
      required: true,
    }),
    unified_national_number: Property.ShortText({
      displayName: 'Unified National Number',
      description:
        'Optional. Saudi Unified National Number (الرقم الوطني الموحد), 10 digits starting with `7`.',
      required: false,
    }),
    is_taxable: Property.Checkbox({
      displayName: 'VAT Registered',
      description:
        'Tick if this merchant is registered for VAT. Affects how invoices to/from them are calculated.',
      required: false,
      defaultValue: true,
    }),
    address_line: Property.ShortText({
      displayName: 'Address — Street',
      required: true,
    }),
    city: Property.ShortText({
      displayName: 'Address — City',
      required: true,
    }),
    postal_code: Property.ShortText({
      displayName: 'Address — Postal Code',
      description: 'Postal code (5 digits in Saudi Arabia).',
      required: true,
    }),
    country: Property.ShortText({
      displayName: 'Address — Country',
      description:
        'ISO 3166-1 alpha-2 country code, e.g. `SA` for Saudi Arabia.',
      required: true,
      defaultValue: 'SA',
    }),
    district: Property.ShortText({
      displayName: 'Address — District',
      description: 'Optional.',
      required: false,
    }),
    region: Property.ShortText({
      displayName: 'Address — Region',
      description: 'Optional.',
      required: false,
    }),
    short_address: Property.ShortText({
      displayName: 'Saudi Short Address',
      description:
        'Optional. National Address short code (4 letters + 4 digits, e.g. `RHRA1234`).',
      required: false,
    }),
    external_ref: qawafelProps.externalRef('Your Reference ID'),
    idempotency_key: qawafelProps.idempotencyKey,
  },
  async run({ auth, propsValue }) {
    const address: Record<string, unknown> = {
      address_line: propsValue.address_line,
      city: propsValue.city,
      postal_code: propsValue.postal_code,
      country: propsValue.country,
    };
    if (propsValue.district) {
      address['district'] = propsValue.district;
    }
    if (propsValue.region) {
      address['region'] = propsValue.region;
    }
    if (propsValue.short_address) {
      address['short_address'] = propsValue.short_address;
    }

    const body: Record<string, unknown> = {
      type: propsValue.type,
      legal_name: propsValue.legal_name,
      name_en: propsValue.name_en,
      name_ar: propsValue.name_ar,
      email: propsValue.email,
      phone: propsValue.phone,
      cr_number: propsValue.cr_number,
      vat_number: propsValue.vat_number,
      address,
    };
    if (propsValue.unified_national_number) {
      body['unified_national_number'] = propsValue.unified_national_number;
    }
    if (propsValue.is_taxable === false) {
      body['is_taxable'] = false;
    }

    const response = await qawafelApiCall({
      auth,
      method: HttpMethod.POST,
      path: '/merchants',
      body,
      idempotencyKey: propsValue.idempotency_key,
    });
    return response.body;
  },
});
