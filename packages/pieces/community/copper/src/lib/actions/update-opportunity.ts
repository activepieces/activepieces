import { createAction, Property } from '@activepieces/pieces-framework';
import { copperAuth } from '../../index';
import { copperRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateOpportunity = createAction({
  auth: copperAuth,
  name: 'copper_update_opportunity',
  displayName: 'Update Opportunity',
  description: 'Update an existing opportunity in Copper',
  props: {
    opportunity_id: Property.ShortText({
      displayName: 'Opportunity ID',
      description: 'ID of the opportunity to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Opportunity Name',
      description: 'Name of the opportunity',
      required: false,
    }),
    monetary_value: Property.Number({
      displayName: 'Monetary Value',
      description: 'Value of the opportunity',
      required: false,
    }),
    primary_contact_id: Property.ShortText({
      displayName: 'Primary Contact ID',
      description: 'ID of the primary contact person',
      required: false,
    }),
    company_id: Property.ShortText({
      displayName: 'Company ID',
      description: 'ID of the associated company',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Additional details about the opportunity',
      required: false,
    }),
    close_date: Property.DateTime({
      displayName: 'Close Date',
      description: 'Expected close date for the opportunity',
      required: false,
    }),
    win_probability: Property.Number({
      displayName: 'Win Probability',
      description: 'Probability of winning (0-100)',
      required: false,
    }),
  },
  async run(context) {
    const { 
      opportunity_id,
      name, 
      monetary_value, 
      primary_contact_id, 
      company_id, 
      details, 
      close_date,
      win_probability
    } = context.propsValue;

    const body: any = {};

    if (name) body.name = name;
    if (monetary_value) body.monetary_value = monetary_value;
    if (primary_contact_id) body.primary_contact_id = primary_contact_id;
    if (company_id) body.company_id = company_id;
    if (details) body.details = details;
    if (close_date) body.close_date = close_date;
    if (win_probability) body.win_probability = win_probability;

    const response = await copperRequest({
      auth: context.auth,
      method: HttpMethod.PUT,
      url: `/opportunities/${opportunity_id}`,
      body,
    });

    return response;
  },
});
