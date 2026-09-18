import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';
import { InstantlyLead } from '../common/types';

export const createLeadAction = createAction({
  auth: instantlyAuth,
  name: 'create_lead',
  classification: 'WRITE',
  displayName: 'Create Lead',
  description: 'Creates a new lead in Instantly.',
  audience: 'both',
  aiMetadata: { description: 'Creates a new lead in Instantly from an email address, with optional name, company, phone, website, custom variables, and direct assignment to a campaign or lead list. Use to push a contact into Instantly before or while enrolling it in outreach. Only the email is required. Not idempotent — each call creates another lead record.', idempotent: false },
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
    custom_variables: Property.Object({
      displayName: 'Custom Variables',
      description:
        'Extra fields to store on the lead, as name and value pairs. You can use them as variables in your Instantly emails.',
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
    if (custom_variables && Object.keys(custom_variables).length > 0) {
      body['custom_variables'] = custom_variables;
    }

    return instantlyClient.makeRequest<InstantlyLead>({
      auth: context.auth.secret_text,
      method: HttpMethod.POST,
      path: 'leads',
      body,
    });
  },
});
