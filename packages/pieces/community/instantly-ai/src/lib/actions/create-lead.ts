import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';
import { InstantlyLead } from '../common/types';

export const createLeadAction = createAction({
  auth: instantlyAuth,
  name: 'create_lead',
  displayName: 'Create Lead',
  description: 'Creates a new lead in Instantly.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the lead.',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      required: false,
    }),
    campaign_id: instantlyProps.campaignId(false),
    list_id: instantlyProps.listId(false),
    custom_variables: Property.Json({
      displayName: 'Custom Variables',
      description:
        'Custom variables for the lead as a JSON object. Values must be strings, numbers, booleans, or null.',
      required: false,
    }),
  },
  async run(context) {
    const {
      email,
      first_name,
      last_name,
      company_name,
      phone,
      website,
      campaign_id,
      list_id,
      custom_variables,
    } = context.propsValue;

    const body: Record<string, unknown> = { email };
    if (first_name) body['first_name'] = first_name;
    if (last_name) body['last_name'] = last_name;
    if (company_name) body['company_name'] = company_name;
    if (phone) body['phone'] = phone;
    if (website) body['website'] = website;
    if (campaign_id) body['campaign'] = campaign_id;
    if (list_id) body['list_id'] = list_id;
    if (custom_variables) body['custom_variables'] = custom_variables;

    return instantlyClient.makeRequest<InstantlyLead>({
      auth: context.auth.secret_text,
      method: HttpMethod.POST,
      path: 'leads',
      body,
    });
  },
});
