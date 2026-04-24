import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { chargebeeAuth } from '../auth';
import { chargebeeRequest, cleanObject } from '../common/client';

export const createCustomer = createAction({
  name: 'create_customer',
  auth: chargebeeAuth,
  displayName: 'Create Customer',
  description: 'Create a customer in Chargebee.',
  props: {
    id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Optional custom customer identifier.',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'For example: en-US, fr-CA.',
      required: false,
    }),
    preferred_currency_code: Property.ShortText({
      displayName: 'Preferred Currency Code',
      description: 'ISO 4217 currency code (e.g. USD, EUR). Requires Multi-currency pricing to be enabled.',
      required: false,
    }),
    auto_collection: Property.StaticDropdown({
      displayName: 'Auto Collection',
      description: 'Whether invoices should be automatically charged when possible.',
      required: false,
      options: {
        options: [
          { label: 'On', value: 'on' },
          { label: 'Off', value: 'off' },
        ],
      },
    }),
    net_term_days: Property.Number({
      displayName: 'Net Term Days',
      description: 'Number of days within which the customer must pay their invoices.',
      required: false,
    }),
    allow_direct_debit: Property.Checkbox({
      displayName: 'Allow Direct Debit',
      description: 'Whether the customer can pay via Direct Debit.',
      required: false,
    }),
    vat_number: Property.ShortText({
      displayName: 'VAT Number',
      description: 'The VAT/tax registration number for the customer.',
      required: false,
    }),
    taxability: Property.StaticDropdown({
      displayName: 'Taxability',
      description: 'Specifies if the customer is liable for tax.',
      required: false,
      options: {
        options: [
          { label: 'Taxable', value: 'taxable' },
          { label: 'Exempt', value: 'exempt' },
        ],
      },
    }),
    invoice_notes: Property.LongText({
      displayName: 'Invoice Notes',
      description: 'A customer-facing note added to all invoices for this customer.',
      required: false,
    }),
    meta_data: Property.Object({
      displayName: 'Metadata',
      description: 'Key-value pairs to store extra information on the customer.',
      required: false,
    }),
    billing_address_first_name: Property.ShortText({
      displayName: 'Billing Address: First Name',
      required: false,
    }),
    billing_address_last_name: Property.ShortText({
      displayName: 'Billing Address: Last Name',
      required: false,
    }),
    billing_address_line1: Property.ShortText({
      displayName: 'Billing Address: Line 1',
      required: false,
    }),
    billing_address_line2: Property.ShortText({
      displayName: 'Billing Address: Line 2',
      required: false,
    }),
    billing_address_city: Property.ShortText({
      displayName: 'Billing Address: City',
      required: false,
    }),
    billing_address_state: Property.ShortText({
      displayName: 'Billing Address: State',
      required: false,
    }),
    billing_address_zip: Property.ShortText({
      displayName: 'Billing Address: ZIP / Postal Code',
      required: false,
    }),
    billing_address_country: Property.ShortText({
      displayName: 'Billing Address: Country',
      description: 'Two-letter ISO 3166-1 alpha-2 country code (e.g. US, GB).',
      required: false,
    }),
  },
  async run(context) {
    const {
      id,
      first_name,
      last_name,
      email,
      company,
      phone,
      locale,
      preferred_currency_code,
      auto_collection,
      net_term_days,
      allow_direct_debit,
      vat_number,
      taxability,
      invoice_notes,
      meta_data,
      billing_address_first_name,
      billing_address_last_name,
      billing_address_line1,
      billing_address_line2,
      billing_address_city,
      billing_address_state,
      billing_address_zip,
      billing_address_country,
    } = context.propsValue;

    return await chargebeeRequest({
      site: context.auth.props.site,
      apiKey: context.auth.props.api_key,
      method: HttpMethod.POST,
      path: '/customers',
      contentType: 'application/x-www-form-urlencoded',
      body: cleanObject({
        id,
        first_name,
        last_name,
        email,
        company,
        phone,
        locale,
        preferred_currency_code,
        auto_collection,
        net_term_days,
        allow_direct_debit,
        vat_number,
        taxability,
        invoice_notes,
        meta_data: meta_data ? JSON.stringify(meta_data) : undefined,
        'billing_address[first_name]': billing_address_first_name,
        'billing_address[last_name]': billing_address_last_name,
        'billing_address[line1]': billing_address_line1,
        'billing_address[line2]': billing_address_line2,
        'billing_address[city]': billing_address_city,
        'billing_address[state]': billing_address_state,
        'billing_address[zip]': billing_address_zip,
        'billing_address[country]': billing_address_country,
      }),
    });
  },
});
