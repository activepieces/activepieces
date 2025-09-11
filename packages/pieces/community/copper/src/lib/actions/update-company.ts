import {
  createAction,
  InputPropertyMap,
  Property,
} from '@activepieces/pieces-framework';
import { CopperAuth, isNonEmptyStr } from '../common/constants';
import { companyDropdown, primaryContactsDropdown } from '../common/props';
import { CopperApiService } from '../common/requests';

export const updateCompany = createAction({
  auth: CopperAuth,
  name: 'updateCompany',
  displayName: 'Update Company',
  description: 'Updates a company record.',
  props: {
    companyId: companyDropdown({ refreshers: ['auth'], required: true }),
    fields: Property.DynamicProperties({
      displayName: '',
      description: '',
      refreshers: ['auth', 'companyId'],
      required: false,
      props: async ({ auth, companyId }: any): Promise<InputPropertyMap> => {
        if (!auth || !companyId) return {};

        const company = JSON.parse(companyId);

        return {
          name: Property.ShortText({
            displayName: 'Full Name',
            required: true,
            defaultValue: company.name,
          }),
          email_domain: Property.ShortText({
            displayName: 'Email Domain',
            description: 'E.g. democompany.com',
            required: false,
            defaultValue: company.email_domain,
          }),
          details: Property.ShortText({
            displayName: 'Details',
            required: false,
            defaultValue: company.details,
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
            defaultValue: company.phone_numbers,
          }),
          address_street: Property.ShortText({
            displayName: 'Street',
            required: false,
            defaultValue: company.address?.street,
          }),
          address_city: Property.ShortText({
            displayName: 'City',
            required: false,
            defaultValue: company.address?.city,
          }),
          address_state: Property.ShortText({
            displayName: 'State/Region',
            required: false,
            defaultValue: company.address?.state,
          }),
          address_postal_code: Property.ShortText({
            displayName: 'Postal Code',
            required: false,
            defaultValue: company.address?.postal_code,
          }),
          address_country: Property.ShortText({
            displayName: 'Country',
            required: false,
            defaultValue: company.address?.country,
          }),
        };
      },
    }),
    primaryContactId: primaryContactsDropdown({ refreshers: ['auth'] }),
  },
  async run(context) {
    const { fields, companyId, primaryContactId } = context.propsValue;

    const company = JSON.parse(companyId as string);

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
    } = fields as any;

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

    return await CopperApiService.updateCompany(context.auth, company.id, body);
  },
});
