import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const createCompany = createAction({
  auth: ninjapipeAuth,
  name: 'create_company',
  displayName: 'Create Company',
  description: 'Creates a new company.',
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    industry: Property.ShortText({ displayName: 'Industry', required: false }),
    website: Property.ShortText({ displayName: 'Website', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    address: Property.LongText({ displayName: 'Address', required: false }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    zip: Property.ShortText({ displayName: 'ZIP Code', required: false }),
    country: ninjapipeCommon.countryDropdown,
    state: Property.ShortText({ displayName: 'State', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    owner: Property.ShortText({ displayName: 'Owner', required: false }),
    notes: Property.LongText({ displayName: 'Notes', required: false }),
    customFields: Property.Object({ displayName: 'Custom Fields', required: false }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, any> = {};
    if (p.name) body.name = p.name;
    if (p.industry) body.industry = p.industry;
    if (p.website) body.website = p.website;
    if (p.email) body.email = p.email;
    if (p.phone) body.phone = p.phone;
    if (p.address) body.address = p.address;
    if (p.city) body.city = p.city;
    if (p.zip) body.zip = p.zip;
    if (p.country) body.country = p.country;
    if (p.state) body.state = p.state;
    if (p.status) body.status = p.status;
    if (p.owner) body.owner = p.owner;
    if (p.notes) body.notes = p.notes;
    if (p.customFields && typeof p.customFields === 'object') body.custom_fields = p.customFields;
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.POST, path: '/companies', body });
    return flattenCustomFields(response.body);
  },
});
