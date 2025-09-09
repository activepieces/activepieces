import { createAction, Property } from '@activepieces/pieces-framework';
import { copperAuth } from '../../index';
import { copperRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateLead = createAction({
  auth: copperAuth,
  name: 'copper_update_lead',
  displayName: 'Update Lead',
  description: 'Update an existing lead in Copper',
  props: {
    lead_id: Property.ShortText({
      displayName: 'Lead ID',
      description: 'ID of the lead to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the lead',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the lead',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number of the lead',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Company name associated with the lead',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Job title of the lead',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Additional details about the lead',
      required: false,
    }),
    monetary_value: Property.Number({
      displayName: 'Monetary Value',
      description: 'Potential monetary value of the lead',
      required: false,
    }),
  },
  async run(context) {
    const { 
      lead_id,
      name, 
      email, 
      phone_number, 
      company_name, 
      title, 
      details, 
      monetary_value 
    } = context.propsValue;

    const body: any = {};

    if (name) body.name = name;
    if (email) {
      body.email = {
        email: email,
        category: 'work'
      };
    }
    if (phone_number) {
      body.phone_number = {
        number: phone_number,
        category: 'work'
      };
    }
    if (company_name) body.company_name = company_name;
    if (title) body.title = title;
    if (details) body.details = details;
    if (monetary_value) body.monetary_value = monetary_value;

    const response = await copperRequest({
      auth: context.auth,
      method: HttpMethod.PUT,
      url: `/leads/${lead_id}`,
      body,
    });

    return response;
  },
});
