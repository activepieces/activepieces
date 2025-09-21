import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { whatConvertsAuth } from '../common/auth';

const WHATCONVERTS_API_URL = 'https://app.whatconverts.com/api/v1';

export const createLeadAction = createAction({
  auth: whatConvertsAuth,
  name: 'create_lead',
  displayName: 'Create Lead',
  description: 'Create a new lead in WhatConverts.',
  props: {
    profile_id: Property.Number({
      displayName: 'Profile ID',
      description: 'The ID of the Profile to add the lead to.',
      required: true,
    }),
    lead_type: Property.StaticDropdown({
      displayName: 'Lead Type',
      description: 'The type of the lead.',
      required: true,
      options: {
        options: [
          { label: 'Phone Call', value: 'Phone Call' },
          { label: 'Web Form', value: 'Web Form' },
          { label: 'Chat', value: 'Chat' },
          { label: 'Transaction', value: 'Transaction' },
          { label: 'Event', value: 'Event' },
        ],
      },
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
    referring_source: Property.ShortText({
      displayName: 'Referring Source',
      description: 'The source of the lead (e.g., "google").',
      required: false,
    }),
    referring_medium: Property.ShortText({
      displayName: 'Referring Medium',
      description: 'The medium of the lead (e.g., "cpc").',
      required: false,
    }),
    referring_campaign: Property.ShortText({
      displayName: 'Referring Campaign',
      required: false,
    }),
    form_name: Property.ShortText({
      displayName: 'Form Name',
      description: 'The name of the form that was submitted.',
      required: false,
    }),
    form_url: Property.ShortText({
      displayName: 'Form URL',
      description: 'The URL where the form was submitted.',
      required: false,
    }),
    send_notification: Property.Checkbox({
      displayName: 'Send Notification',
      description: 'Set to true to send a new lead notification email.',
      required: false,
      defaultValue: false,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;

    const leadDetails: { [key: string]: string | undefined } = {
      first_name: propsValue.first_name,
      last_name: propsValue.last_name,
      email: propsValue.email,
      phone_number: propsValue.phone_number,
      company_name: propsValue.company_name,
      notes: propsValue.notes,
    };

    Object.keys(leadDetails).forEach(
      (key) => leadDetails[key] === undefined && delete leadDetails[key]
    );

    const body = {
      profile_id: propsValue.profile_id,
      lead_type: propsValue.lead_type,
      referring_source: propsValue.referring_source,
      referring_medium: propsValue.referring_medium,
      referring_campaign: propsValue.referring_campaign,
      form_name: propsValue.form_name,
      form_url: propsValue.form_url,
      send_notification: propsValue.send_notification,
      lead_details: leadDetails,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${WHATCONVERTS_API_URL}/leads`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.api_token,
        password: auth.api_secret as string,
      },
      body: body,
    });

    return response.body;
  },
});
