import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeApiRequest } from '../common/client';
import { buildPairObject, flattenCustomFields, extractItems } from '../common/helpers';
import { COUNTRIES, STATES_DE, STATES_AT, STATES_CH, CURRENCIES } from '../common/constants';

export const createOrUpdateCompany = createAction({
  auth: ninjapipeAuth,
  name: 'create_or_update_company',
  displayName: 'Create Or Update Company',
  description: 'Create a new company or update existing one by exact company name',
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Exact company name for lookup (used to find existing companies)',
      required: true,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      required: false,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      required: false,
    }),
    employees: Property.Number({
      displayName: 'Number of Employees',
      required: false,
    }),
    annual_revenue: Property.Number({
      displayName: 'Annual Revenue',
      required: false,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: false,
      options: { options: CURRENCIES },
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    street: Property.ShortText({
      displayName: 'Street',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'ZIP / Postal Code',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    country: Property.StaticDropdown({
      displayName: 'Country',
      required: false,
      options: { options: COUNTRIES },
    }),
    state_de: Property.StaticDropdown({
      displayName: 'State (Germany)',
      required: false,
      options: { options: STATES_DE },
    }),
    state_at: Property.StaticDropdown({
      displayName: 'State (Austria)',
      required: false,
      options: { options: STATES_AT },
    }),
    state_ch: Property.StaticDropdown({
      displayName: 'Canton (Switzerland)',
      required: false,
      options: { options: STATES_CH },
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    owner_id: Property.ShortText({
      displayName: 'Owner ID',
      description: 'User ID of the owner',
      required: false,
    }),
    customFields: Property.Array({
      displayName: 'Custom Fields',
      required: false,
      properties: {
        field: Property.ShortText({ displayName: 'Field Name', required: true }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: true,
          options: {
            options: [
              { label: 'String', value: 'string' },
              { label: 'Number', value: 'number' },
              { label: 'Boolean', value: 'boolean' },
              { label: 'JSON', value: 'json' },
              { label: 'Null', value: 'null' },
            ],
          },
        }),
        value: Property.ShortText({ displayName: 'Value', required: true }),
      },
    }),
    additionalFields: Property.Array({
      displayName: 'Additional Fields',
      required: false,
      properties: {
        field: Property.ShortText({ displayName: 'Field Name', required: true }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: true,
          options: {
            options: [
              { label: 'String', value: 'string' },
              { label: 'Number', value: 'number' },
              { label: 'Boolean', value: 'boolean' },
              { label: 'JSON', value: 'json' },
              { label: 'Null', value: 'null' },
            ],
          },
        }),
        value: Property.ShortText({ displayName: 'Value', required: true }),
      },
    }),
    flattenCustomFields: Property.Checkbox({
      displayName: 'Flatten Custom Fields',
      description: 'Flatten custom_fields object to top-level',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const companyName = propsValue.name as string;

    const existing = await findCompanyByName(auth as { base_url: string; api_key: string }, companyName);

    const body: Record<string, unknown> = { name: companyName };

    const fieldMappings: Record<string, string> = {
      website: 'website',
      industry: 'industry',
      employees: 'employees',
      annual_revenue: 'annual_revenue',
      currency: 'currency',
      phone: 'phone',
      street: 'street',
      zip: 'zip',
      city: 'city',
      country: 'country',
      state_de: 'state_de',
      state_at: 'state_at',
      state_ch: 'state_ch',
      description: 'description',
      owner_id: 'owner_id',
    };

    for (const [prop, field] of Object.entries(fieldMappings)) {
      if (propsValue[prop] !== undefined && propsValue[prop] !== null) {
        body[field] = propsValue[prop];
      }
    }

    const customFields = propsValue.customFields as Array<{ field: string; type: string; value: string }> | undefined;
    if (customFields && customFields.length > 0) {
      body.custom_fields = buildPairObject(customFields);
    }

    const additionalFields = propsValue.additionalFields as Array<{ field: string; type: string; value: string }> | undefined;
    if (additionalFields && additionalFields.length > 0) {
      Object.assign(body, buildPairObject(additionalFields));
    }

    let response: unknown;

    if (existing) {
      response = await ninjapipeApiRequest(
        auth as { base_url: string; api_key: string },
        HttpMethod.PUT,
        `/companies/${existing.id}`,
        body,
      );
    } else {
      response = await ninjapipeApiRequest(
        auth as { base_url: string; api_key: string },
        HttpMethod.POST,
        '/companies',
        body,
      );
    }

    if (propsValue.flattenCustomFields) {
      return flattenCustomFields(response as Record<string, unknown>);
    }

    return response;
  },
});

async function findCompanyByName(auth: { base_url: string; api_key: string }, name: string) {
  const response = await ninjapipeApiRequest(
    auth,
    HttpMethod.GET,
    '/companies',
    undefined,
    { search: name, page: 1, limit: 100 },
  );

  const items = extractItems(response);
  const matched = items.find(
    (item: Record<string, unknown>) =>
      String(item.name || '').toLowerCase() === name.toLowerCase(),
  );

  return matched || null;
}
