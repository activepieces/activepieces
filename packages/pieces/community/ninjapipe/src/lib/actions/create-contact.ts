import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, extractItems, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const createContact = createAction({
  auth: ninjapipeAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Creates a new contact. Choose what happens if a contact with the same email already exists.',
  props: {
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', description: 'The email address of the contact.', required: true }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    company: Property.ShortText({ displayName: 'Company', description: 'Company name or ID.', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    owner: Property.ShortText({ displayName: 'Owner', required: false }),
    address: Property.LongText({ displayName: 'Address', required: false }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    zip: Property.ShortText({ displayName: 'ZIP Code', required: false }),
    country: ninjapipeCommon.countryDropdown,
    state: Property.ShortText({ displayName: 'State', required: false }),
    notes: Property.LongText({ displayName: 'Notes', required: false }),
    customFields: Property.Object({ displayName: 'Custom Fields', description: 'Key-value pairs sent as custom_fields.', required: false }),
    ifContactExists: Property.StaticDropdown({
      displayName: 'If Contact Exists',
      description: 'What to do when a contact with this email already exists.',
      required: false,
      defaultValue: 'error',
      options: {
        options: [
          { label: 'Throw Error', value: 'error' },
          { label: 'Skip', value: 'skip' },
          { label: 'Get Existing', value: 'getExisting' },
          { label: 'Update Existing', value: 'updateExisting' },
        ],
      },
    }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, any> = {};
    if (p.firstName !== undefined) body['first_name'] = p.firstName;
    if (p.lastName !== undefined) body['last_name'] = p.lastName;
    if (p.email !== undefined) body['email'] = p.email;
    if (p.phone !== undefined) body['phone'] = p.phone;
    if (p.company !== undefined) body['company'] = p.company;
    if (p.status !== undefined) body['status'] = p.status;
    if (p.owner !== undefined) body['owner'] = p.owner;
    if (p.address !== undefined) body['address'] = p.address;
    if (p.city !== undefined) body['city'] = p.city;
    if (p.zip !== undefined) body['zip'] = p.zip;
    if (p.country !== undefined) body['country'] = p.country;
    if (p.state !== undefined) body['state'] = p.state;
    if (p.notes !== undefined) body['notes'] = p.notes;
    if (p.customFields && typeof p.customFields === 'object') {
      body['custom_fields'] = p.customFields;
    }

    try {
      const response = await ninjapipeApiCall<Record<string, any>>({
        auth,
        method: HttpMethod.POST,
        path: '/contacts',
        body,
      });
      return flattenCustomFields(response.body);
    } catch (error: any) {
      const status = error?.response?.status ?? error?.status ?? 0;
      if (status === 409 && p.ifContactExists && p.ifContactExists !== 'error') {
        const search = await ninjapipeApiCall<Record<string, any>>({
          auth,
          method: HttpMethod.GET,
          path: '/contacts',
          queryParams: { search: p.email as string, limit: '5' },
        });
        const items = extractItems(search.body);
        const existing = items.find((c: any) =>
          c.email?.toLowerCase?.() === p.email?.toLowerCase?.()
        ) as any;
        if (!existing) {
          throw new Error('Duplicate detected but could not locate existing contact by email.');
        }

        if (p.ifContactExists === 'skip') {
          return { skipped: true, reason: 'contact_exists', email: p.email, existing_id: existing.id };
        }
        if (p.ifContactExists === 'getExisting') {
          return flattenCustomFields(existing);
        }
        if (p.ifContactExists === 'updateExisting') {
          const update = await ninjapipeApiCall<Record<string, any>>({
            auth,
            method: HttpMethod.PUT,
            path: `/contacts/${existing.id}`,
            body,
          });
          return flattenCustomFields(update.body);
        }
      }
      throw new Error(`Failed to create contact: ${error?.message ?? String(error)}`);
    }
  },
});
