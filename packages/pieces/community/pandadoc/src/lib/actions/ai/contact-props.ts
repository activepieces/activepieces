import { Property } from '@activepieces/pieces-framework';
import { pandadocInputs } from '../../common/inputs';

export function contactBody(values: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    CONTACT_KEYS.flatMap((key) => {
      const value = pandadocInputs.optionalString(values[key]);
      return value === undefined ? [] : [[key, value]];
    }),
  );
}

export const contactProps = {
  first_name: Property.ShortText({ displayName: 'First Name', required: false }),
  last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
  company: Property.ShortText({ displayName: 'Company', required: false }),
  job_title: Property.ShortText({ displayName: 'Job Title', required: false }),
  phone: Property.ShortText({ displayName: 'Phone', required: false }),
  street_address: Property.ShortText({ displayName: 'Street Address', required: false }),
  city: Property.ShortText({ displayName: 'City', required: false }),
  state: Property.ShortText({ displayName: 'State', required: false }),
  postal_code: Property.ShortText({ displayName: 'Postal Code', required: false }),
  country: Property.ShortText({ displayName: 'Country', required: false }),
};

const CONTACT_KEYS = ['first_name', 'last_name', 'company', 'job_title', 'phone', 'street_address', 'city', 'state', 'postal_code', 'country'];
