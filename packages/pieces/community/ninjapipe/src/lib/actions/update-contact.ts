import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const updateContact = createAction({
  auth: ninjapipeAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Updates an existing contact by ID.',
  props: {
    contactId: Property.ShortText({ displayName: 'Contact ID', description: 'The ID of the contact to update.', required: true }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    company: Property.ShortText({ displayName: 'Company', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    owner: Property.ShortText({ displayName: 'Owner', required: false }),
    address: Property.LongText({ displayName: 'Address', required: false }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    zip: Property.ShortText({ displayName: 'ZIP Code', required: false }),
    country: ninjapipeCommon.countryDropdown,
    state: Property.ShortText({ displayName: 'State', required: false }),
    notes: Property.LongText({ displayName: 'Notes', required: false }),
    customFields: Property.Object({ displayName: 'Custom Fields', required: false }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, any> = {};
    if (p.firstName) body.first_name = p.firstName;
    if (p.lastName) body.last_name = p.lastName;
    if (p.email) body.email = p.email;
    if (p.phone) body.phone = p.phone;
    if (p.company) body.company = p.company;
    if (p.status) body.status = p.status;
    if (p.owner) body.owner = p.owner;
    if (p.address) body.address = p.address;
    if (p.city) body.city = p.city;
    if (p.zip) body.zip = p.zip;
    if (p.country) body.country = p.country;
    if (p.state) body.state = p.state;
    if (p.notes) body.notes = p.notes;
    if (p.customFields && typeof p.customFields === 'object') {
      body.custom_fields = p.customFields;
    }

    const response = await ninjapipeApiCall<Record<string, any>>({
      auth,
      method: HttpMethod.PUT,
      path: `/contacts/${p.contactId}`,
      body,
    });
    return flattenCustomFields(response.body);
  },
});
