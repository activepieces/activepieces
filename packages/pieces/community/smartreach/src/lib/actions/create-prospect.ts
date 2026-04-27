import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { smartreachAuth } from '../..';
import { SMARTREACH_API_BASE, getHeaders } from '../common';

export const createProspect = createAction({
  name: 'createProspect',
  auth: smartreachAuth,
  displayName: 'Create Prospect',
  description: 'Add a new prospect to a SmartReach campaign',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
      description: 'Email address of the prospect',
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
      description: 'First name of the prospect',
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
      description: 'Last name of the prospect',
    }),
    company: Property.ShortText({
      displayName: 'Company',
      required: false,
      description: 'Company name of the prospect',
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
      description: 'Job title of the prospect',
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
      description: 'Phone number of the prospect',
    }),
    campaignId: Property.ShortText({
      displayName: 'Campaign ID',
      required: false,
      description: 'ID of the campaign to add the prospect to',
    }),
    customFields: Property.Object({
      displayName: 'Custom Fields',
      required: false,
      description: 'Custom fields as key-value pairs',
    }),
  },

  async run(context) {
    const body: Record<string, unknown> = {
      email: context.propsValue.email,
    };

    if (context.propsValue.firstName) {
      body['first_name'] = context.propsValue.firstName;
    }
    if (context.propsValue.lastName) {
      body['last_name'] = context.propsValue.lastName;
    }
    if (context.propsValue.company) {
      body['company'] = context.propsValue.company;
    }
    if (context.propsValue.title) {
      body['title'] = context.propsValue.title;
    }
    if (context.propsValue.phone) {
      body['phone'] = context.propsValue.phone;
    }
    if (context.propsValue.campaignId) {
      body['campaign_id'] = context.propsValue.campaignId;
    }
    if (context.propsValue.customFields) {
      body['custom_fields'] = context.propsValue.customFields;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${SMARTREACH_API_BASE}/prospects`,
      headers: getHeaders(context.auth),
      body,
    });

    return response.body;
  },
});
