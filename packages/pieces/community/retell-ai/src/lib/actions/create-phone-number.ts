import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retellAiAuth } from '../..';
import { retellAiCommon } from '../common';

export const createPhoneNumberAction = createAction({
  auth: retellAiAuth,
  name: 'create_phone_number',
  displayName: 'Create a Phone Number',
  description: 'Buys a new phone number and binds agents.',
  props: {
    inbound_agent_id: Property.ShortText({
      displayName: 'Inbound Agent ID',
      description: 'The agent to use for inbound calls. If null, inbound calls are not accepted.',
      required: false,
    }),
    outbound_agent_id: Property.ShortText({
      displayName: 'Outbound Agent ID',
      description: 'The agent to use for outbound calls. If null, outbound calls cannot be initiated without an override.',
      required: false,
    }),
    area_code: Property.Number({
      displayName: 'Area Code',
      description: 'Area code of the number to obtain (e.g., 415). Only supports US area codes.',
      required: false,
    }),
    nickname: Property.ShortText({
      displayName: 'Nickname',
      description: 'A friendly name for your reference.',
      required: false,
    }),
    inbound_webhook_url: Property.ShortText({
        displayName: 'Inbound Webhook URL',
        description: 'If set, will send a webhook for inbound calls to override agent settings.',
        required: false,
    }),
    number_provider: Property.StaticDropdown({
        displayName: 'Number Provider',
        description: 'The provider to purchase the phone number from.',
        required: false,
        options: {
            options: [
                { label: 'Twilio', value: 'twilio' },
                { label: 'Telnyx', value: 'telnyx' },
            ],
        },
        defaultValue: 'twilio',
    }),
    country_code: Property.StaticDropdown({
        displayName: 'Country Code',
        description: 'The ISO 3166-1 alpha-2 country code of the number.',
        required: false,
        options: {
            options: [
                { label: 'United States', value: 'US' },
                { label: 'Canada', value: 'CA' },
            ],
        },
        defaultValue: 'US',
    }),
    toll_free: Property.Checkbox({
        displayName: 'Toll-Free',
        description: 'Whether to purchase a toll-free number. Toll-free numbers incur higher costs.',
        required: false,
        defaultValue: false,
    }),
    phone_number: Property.ShortText({
        displayName: 'Specific Phone Number',
        description: 'A specific number you want to purchase in E.164 format. If provided, Area Code is ignored.',
        required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    // Construct the request body from props, excluding any undefined values
    const body: Record<string, unknown> = {};
    Object.keys(propsValue).forEach(key => {
        if (propsValue[key as keyof typeof propsValue] !== undefined && propsValue[key as keyof typeof propsValue] !== null) {
            body[key] = propsValue[key as keyof typeof propsValue];
        }
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${retellAiCommon.baseUrl}/create-phone-number`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: body,
    });

    return response.body;
  },
});
