import { createAction, Property } from '@activepieces/pieces-framework';
import { CopperAuth, isNonEmptyStr } from '../common/constants';
import { CopperApiService } from '../common/requests';

export const createLead = createAction({
  auth: CopperAuth,
  name: 'createLead',
  displayName: 'Create Lead',
  description: 'Adds a new lead.',
  props: {
    name: Property.ShortText({ displayName: 'Full Name', required: true }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    category: Property.ShortText({
      displayName: 'Category of the email address (e.g., work, personal)',
      required: true,
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
  },
  async run(context) {
    const {
      name,
      email,
      category,
      address_street,
      address_city,
      address_state,
      address_postal_code,
      address_country,
      phone_numbers,
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
      email: {
        email,
        category
      },
      ...(normPhones.length ? { phone_numbers: normPhones } : {}),
      ...(address ? { address } : {}),
    };

    return await CopperApiService.createLead(context.auth, body);
  },
});
