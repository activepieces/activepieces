import {
  createAction,
  InputPropertyMap,
  Property,
} from '@activepieces/pieces-framework';
import { CopperAuth, isNonEmptyStr } from '../common/constants';
import { leadDropdown, peopleDropdown } from '../common/props';
import { CopperApiService } from '../common/requests';

export const updateLead = createAction({
  auth: CopperAuth,
  name: 'updateLead',
  displayName: 'Update Lead',
  description: 'Updates an existing lead.',
  props: {
    leadId: leadDropdown(['auth']),
    fields: Property.DynamicProperties({
      displayName: '',
      description: '',
      refreshers: ['auth', 'leadId'],
      required: false,
      props: async ({ auth, leadId }: any): Promise<InputPropertyMap> => {
        if (!auth || !leadId) return {};

        const lead = JSON.parse(leadId);

        return {
          name: Property.ShortText({
            displayName: 'Full Name',
            required: true,
            defaultValue: lead.name,
          }),
          email: Property.ShortText({
            displayName: 'Email',
            required: true,
            defaultValue: lead.email.email,
          }),
          category: Property.ShortText({
            displayName: 'Category of the email address (e.g., work, personal)',
            required: true,
            defaultValue: lead.email.category,
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
            defaultValue: lead.phone_numbers,
          }),
          address_street: Property.ShortText({
            displayName: 'Street',
            required: false,
            defaultValue: lead.address?.street,
          }),
          address_city: Property.ShortText({
            displayName: 'City',
            required: false,
            defaultValue: lead.address?.city,
          }),
          address_state: Property.ShortText({
            displayName: 'State/Region',
            required: false,
            defaultValue: lead.address?.state,
          }),
          address_postal_code: Property.ShortText({
            displayName: 'Postal Code',
            required: false,
            defaultValue: lead.address?.postal_code,
          }),
          address_country: Property.ShortText({
            displayName: 'Country',
            required: false,
            defaultValue: lead.address?.country,
          }),
        };
      },
    }),
  },
  async run(context) {
    const fields = (context.propsValue as any).fields;
    const leadId = (context.propsValue as any).leadId;

    const lead = JSON.parse(leadId);

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
    } = fields;

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
        category,
      },
      ...(normPhones.length ? { phone_numbers: normPhones } : {}),
      ...(address ? { address } : {}),
    };

    return await CopperApiService.updateLead(context.auth, lead.id, body);
  },
});
