import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeApiRequest, findContactByEmail } from '../common/client';
import { buildPairObject, flattenCustomFields } from '../common/helpers';
import { COUNTRIES, STATES_DE, STATES_AT, STATES_CH, CURRENCIES } from '../common/constants';

export const createOrUpdateContact = createAction({
  auth: ninjapipeAuth,
  name: 'create_or_update_contact',
  displayName: 'Create Or Update Contact',
  description: 'Create a new contact or update existing one by email',
  props: {
    salutation: Property.ShortText({
      displayName: 'Salutation',
      description: 'e.g. Mr., Ms., Dr.',
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
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Job title',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
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
    website: Property.ShortText({
      displayName: 'Website',
      required: false,
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
    lead_source: Property.ShortText({
      displayName: 'Lead Source',
      required: false,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: false,
      options: { options: CURRENCIES },
    }),
    language: Property.ShortText({
      displayName: 'Language',
      required: false,
    }),
    newsletter: Property.Checkbox({
      displayName: 'Newsletter',
      required: false,
      defaultValue: false,
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
    const email = propsValue.email as string;

    const existing = await findContactByEmail(auth as { base_url: string; api_key: string }, email);

    const body: Record<string, unknown> = { email };

    const fieldMappings: Record<string, string> = {
      salutation: 'salutation',
      first_name: 'first_name',
      last_name: 'last_name',
      phone: 'phone',
      mobile: 'mobile',
      title: 'title',
      company_name: 'company_name',
      street: 'street',
      zip: 'zip',
      city: 'city',
      country: 'country',
      state_de: 'state_de',
      state_at: 'state_at',
      state_ch: 'state_ch',
      website: 'website',
      description: 'description',
      owner_id: 'owner_id',
      lead_source: 'lead_source',
      currency: 'currency',
      language: 'language',
      newsletter: 'newsletter',
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
        `/contacts/${existing.id}`,
        body,
      );
    } else {
      response = await ninjapipeApiRequest(
        auth as { base_url: string; api_key: string },
        HttpMethod.POST,
        '/contacts',
        body,
      );
    }

    if (propsValue.flattenCustomFields) {
      return flattenCustomFields(response as Record<string, unknown>);
    }

    return response;
  },
});
