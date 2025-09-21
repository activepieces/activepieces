import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { whatConvertsAuth } from '../common/auth';
import { whatConvertsClient } from '../common/client';
import { leadDropdown, searchByDropdown } from '../common/props';

export const findLead = createAction({
  auth: whatConvertsAuth,
  name: 'find_lead',
  displayName: 'Find Lead',
  description: 'Retrieve an existing lead by its ID, email, or phone number.',
  props: {
    search_by: searchByDropdown(),
    
    criteria: Property.DynamicProperties({
        displayName: 'Search Criteria',
        required: true,
        refreshers: ['search_by'],
        props: async (refreshers) => {
            const searchBy = String(refreshers['search_by']);
            const fields: DynamicPropsValue = {};

            if (searchBy === 'id') {
                fields['lead_id'] = leadDropdown();
                fields['customer_journey'] = Property.Checkbox({
                    displayName: 'Include Customer Journey',
                    description: "If true, the API response will include the customer journey data.",
                    required: false,
                    defaultValue: false,
                });
            } else if (searchBy === 'email') {
                fields['email_address'] = Property.ShortText({
                    displayName: 'Email Address',
                    required: true,
                });
            } else if (searchBy === 'phone') {
                fields['phone_number'] = Property.ShortText({
                    displayName: 'Phone Number',
                    required: true,
                });
            }
            return fields;
        }
    })
  },
  async run(context) {
    const { auth } = context;
    const search_by = context.propsValue['search_by'];
    const criteria = context.propsValue['criteria'];

    if (search_by === 'id') {
        return await whatConvertsClient.getLead(auth, criteria['lead_id'] as number, {
            customer_journey: criteria['customer_journey'] ? 'true' : 'false'
        });
    } else {
        const params: Record<string, string> = {};
        const email = criteria['email_address'] as string | undefined;
        const phone = criteria['phone_number'] as string | undefined;

        if (email) {
            params['email_address'] = email;
        }
        if (phone) {
            params['phone_number'] = phone;
        }

        const response = await whatConvertsClient.getLeads(auth, params);
        return response.leads[0] ?? null;
    }
  },
});