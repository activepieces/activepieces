import { createAction, Property } from '@activepieces/pieces-framework';
import { copperAuth } from '../../index';
import { copperRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const convertLead = createAction({
  auth: copperAuth,
  name: 'copper_convert_lead',
  displayName: 'Convert Lead',
  description: 'Convert a lead into a person (optionally with company/opportunity)',
  props: {
    lead_id: Property.ShortText({
      displayName: 'Lead ID',
      description: 'ID of the lead to convert',
      required: true,
    }),
    create_opportunity: Property.Checkbox({
      displayName: 'Create Opportunity',
      description: 'Whether to create an opportunity when converting',
      required: false,
      defaultValue: false,
    }),
    opportunity_name: Property.ShortText({
      displayName: 'Opportunity Name',
      description: 'Name for the new opportunity (if creating one)',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Company name to associate with the converted person',
      required: false,
    }),
  },
  async run(context) {
    const { 
      lead_id,
      create_opportunity,
      opportunity_name,
      company_name
    } = context.propsValue;

    const body: any = {};

    if (create_opportunity) {
      body.create_opportunity = true;
      if (opportunity_name) {
        body.opportunity = {
          name: opportunity_name
        };
      }
    }

    if (company_name) {
      body.company = {
        name: company_name
      };
    }

    const response = await copperRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      url: `/leads/${lead_id}/convert`,
      body,
    });

    return response;
  },
});
