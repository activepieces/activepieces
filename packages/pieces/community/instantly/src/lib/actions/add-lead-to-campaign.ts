import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { InstantlyCommon } from '../common';
import { instantlyAuth } from '../../index';

export const addLeadToCampaignAction = createAction({
  auth: instantlyAuth,
  name: 'add_lead_to_campaign',
  displayName: 'Add Lead to Campaign',
  description: 'Add a specific lead to a campaign or lead list in Instantly',
  props: {
    campaign_id: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'ID of the campaign to add the lead to',
      required: false,
    }),
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'ID of the lead list to add the lead to',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the lead',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the lead',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the lead',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Company name of the lead',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number of the lead',
      required: false,
    }),
    custom_attributes: Property.Object({
      displayName: 'Custom Attributes',
      description: 'Additional custom attributes for the lead',
      required: false,
    }),
  },
  async run(context) {
    const {
      campaign_id,
      list_id,
      email,
      first_name,
      last_name,
      company,
      phone,
      custom_attributes,
    } = context.propsValue;
    const { auth: apiKey } = context;

    if (!campaign_id && !list_id) {
      throw new Error('Either Campaign ID or List ID must be provided');
    }

    const lead: Record<string, unknown> = {
      email,
    };

    if (first_name) {
      lead.first_name = first_name;
    }

    if (last_name) {
      lead.last_name = last_name;
    }

    if (company) {
      lead.company = company;
    }

    if (phone) {
      lead.phone = phone;
    }

    if (custom_attributes) {
      lead.custom_attributes = custom_attributes;
    }

    const endpoint = campaign_id
      ? `campaigns/${campaign_id}/leads`
      : `lead-lists/${list_id}/leads`;

    const response = await InstantlyCommon.makeRequest({
      endpoint,
      method: HttpMethod.POST,
      apiKey: apiKey as string,
      body: { leads: [lead] },
    });

    return response;
  },
});
