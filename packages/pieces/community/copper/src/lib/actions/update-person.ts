import {
  createAction,
  InputPropertyMap,
  Property,
} from '@activepieces/pieces-framework';
import { CopperAuth, isNonEmptyStr } from '../common/constants';
import { peopleDropdown } from '../common/props';
import { CopperApiService } from '../common/requests';

export const updatePerson = createAction({
  auth: CopperAuth,
  name: 'updatePerson',
  displayName: 'Update Person',
  description: 'Updates a person based on matching criteria.',
  props: {
    personId: peopleDropdown(['auth']),
    fields: Property.DynamicProperties({
      displayName: '',
      description: '',
      refreshers: ['auth', 'personId'],
      required: false,
      props: async ({ auth, personId }: any): Promise<InputPropertyMap> => {
        if (!auth || !personId) return {};

        const person = JSON.parse(personId);

        return {
          name: Property.ShortText({
            displayName: 'Full Name',
            required: true,
            defaultValue: person.name,
          }),
          emails: Property.Array({
            displayName: 'Emails',
            required: true,
            properties: {
              email: Property.ShortText({
                displayName: 'Email',
                required: true,
              }),
              category: Property.ShortText({
                displayName: 'Category (e.g., work, personal)',
                required: true,
              }),
            },
            defaultValue: person.emails,
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
            defaultValue: person.phone_numbers,
          }),
          address_street: Property.ShortText({
            displayName: 'Street',
            required: false,
            defaultValue: person.address?.street,
          }),
          address_city: Property.ShortText({
            displayName: 'City',
            required: false,
            defaultValue: person.address?.city,
          }),
          address_state: Property.ShortText({
            displayName: 'State/Region',
            required: false,
            defaultValue: person.address?.state,
          }),
          address_postal_code: Property.ShortText({
            displayName: 'Postal Code',
            required: false,
            defaultValue: person.address?.postal_code,
          }),
          address_country: Property.ShortText({
            displayName: 'Country',
            required: false,
            defaultValue: person.address?.country,
          }),
        };
      },
    }),
  },
  async run(context) {
    const fields = (context.propsValue as any).fields;
    const personId = (context.propsValue as any).personId;

    const person = JSON.parse(personId);

    const {
      name,
      emails,
      address_street,
      address_city,
      address_state,
      address_postal_code,
      address_country,
      phone_numbers,
    } = fields;

    const normEmails = (Array.isArray(emails) ? emails : [])
      .map((row) => ({
        email: String(row?.email ?? '')
          .trim()
          .toLowerCase(),
        category: isNonEmptyStr(row?.category)
          ? String(row.category).trim()
          : undefined,
      }))
      .filter((e) => isNonEmptyStr(e.email));

    if (normEmails.length === 0)
      throw new Error('Please provide at least one valid email.');

    const seen = new Set<string>();
    const dedupedEmails = normEmails.filter(
      (e) => !seen.has(e.email) && (seen.add(e.email), true)
    );

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
      emails: dedupedEmails,
      ...(normPhones.length ? { phone_numbers: normPhones } : {}),
      ...(address ? { address } : {}),
    };

    return await CopperApiService.updatePerson(context.auth, person.id,  body);
  },
});
