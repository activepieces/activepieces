import { createAction, Property } from '@activepieces/pieces-framework';
import { copperAuth } from '../../index';
import { copperRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createLead = createAction({
  auth: copperAuth,
  name: 'copper_create_lead',
  displayName: 'Create Lead',
  description: 'Create a new lead in Copper',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the lead',
      required: true,
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
      name, 
      email, 
      phone_number, 
      company_name, 
      title, 
      details, 
      monetary_value 
    } = context.propsValue;

    const body: any = {
      name,
    };

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
      method: HttpMethod.POST,
      url: '/leads',
      body,
    });

    return response;
  },
});
