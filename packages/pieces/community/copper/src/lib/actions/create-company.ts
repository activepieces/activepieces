import { createAction, Property } from '@activepieces/pieces-framework';
import { CopperAuth, isNonEmptyStr } from '../common/constants';
import { primaryContactsDropdown } from '../common/props';
import { CopperApiService } from '../common/requests';

export const createCompany = createAction({
  auth: CopperAuth,
  name: 'createCompany',
  displayName: 'Create Company',
  description: 'Adds a new company.',
  props: {
    name: Property.ShortText({ displayName: 'Full Name', required: true }),
    email_domain: Property.ShortText({
      displayName: 'Email Domain',
      description: 'E.g. democompany.com',
      required: false,
    }),
    details: Property.ShortText({
      displayName: 'Details',
      required: false,
    }),
    phone_numbers: Property.Array({
      displayName: 'Phone Numbers',
      required: false,
      properties: {
        number: Property.ShortText({
          displayName: 'Number',
          required: true,
        }),
        category: Property.ShortText({
          displayName: 'Category (e.g., mobile, work, personal)',
          required: true,
        }),
      },
      defaultValue: [],
    }),
    address_street: Property.ShortText({
      displayName: 'Street',
      required: false,
    }),
    address_city: Property.ShortText({ displayName: 'City', required: false }),
    address_state: Property.ShortText({
      displayName: 'State/Region',
      required: false,
    }),
    address_postal_code: Property.ShortText({
      displayName: 'Postal Code',
      required: false,
    }),
    address_country: Property.ShortText({
      displayName: 'Country',
      required: false,
    }),
    primaryContactId: primaryContactsDropdown({ refreshers: ['auth'] }),
  },
  async run(context) {
    const {
      name,
      email_domain,
      details,
      address_street,
      address_city,
      address_state,
      address_postal_code,
      address_country,
      phone_numbers,
      primaryContactId,
    } = context.propsValue as any;

    const normPhones = (Array.isArray(phone_numbers) ? phone_numbers : [])
      .map((p) => ({
        number: String(p?.number ?? '').trim(),
        category: isNonEmptyStr(p?.category)
          ? String(p.category).trim()
          : undefined,
      }))
      .filter((p) => isNonEmptyStr(p.number));

    const address = [
      address_street,
      address_city,
      address_state,
      address_postal_code,
      address_country,
    ].some(isNonEmptyStr)
      ? {
          street: isNonEmptyStr(address_street)
            ? address_street.trim()
            : undefined,
          city: isNonEmptyStr(address_city) ? address_city.trim() : undefined,
          state: isNonEmptyStr(address_state)
            ? address_state.trim()
            : undefined,
          postal_code: isNonEmptyStr(address_postal_code)
            ? address_postal_code.trim()
            : undefined,
          country: isNonEmptyStr(address_country)
            ? address_country.trim()
            : undefined,
        }
      : undefined;

    const body: any = {
      name,
      email_domain,
      details,
      ...(normPhones.length ? { phone_numbers: normPhones } : {}),
      ...(address ? { address } : {}),
      primary_contact_id: primaryContactId,
    };

    return await CopperApiService.createCompany(context.auth, body);
  },
});
