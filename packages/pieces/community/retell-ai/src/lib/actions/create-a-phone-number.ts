import { createAction, Property } from '@activepieces/pieces-framework';
import { RetllAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentIdDropdown } from '../common/props';

export const createAPhoneNumber = createAction({
  auth: RetllAiAuth,
  name: 'createAPhoneNumber',
  displayName: 'Create a Phone Number',
  description: 'Buy a new phone number and bind it to Retell AI agents',
  props: {
    areaCode: Property.Number({
      displayName: 'Area Code',
      description: 'The area code for the phone number (e.g., 415, 212)',
      required: true,
    }),
    inboundAgentId: agentIdDropdown('Inbound Agent ID'),
    outboundAgentId: agentIdDropdown('Outbound Agent ID'),
    inboundAgentVersion: Property.Number({
      displayName: 'Inbound Agent Version',
      description: 'Version of the inbound agent to use',
      required: false,
    }),
    outboundAgentVersion: Property.Number({
      displayName: 'Outbound Agent Version',
      description: 'Version of the outbound agent to use',
      required: false,
    }),
    nickname: Property.ShortText({
      displayName: 'Nickname',
      description: 'A friendly name for this phone number',
      required: false,
    }),
    inboundWebhookUrl: Property.ShortText({
      displayName: 'Inbound Webhook URL',
      description: 'URL to receive webhook notifications for inbound calls',
      required: false,
    }),
    numberProvider: Property.StaticDropdown({
      displayName: 'Number Provider',
      description: 'The provider to use for the phone number',
      required: false,
      defaultValue: 'twilio',
      options: {
        options: [
          { label: 'Twilio', value: 'twilio' },
          { label: 'Telnyx', value: 'telnyx' },
        ],
      },
    }),
    countryCode: Property.StaticDropdown({
      displayName: 'Country Code',
      description: 'The country code for the phone number',
      required: false,
      defaultValue: 'US',
      options: {
        options: [
          { label: 'United States', value: 'US' },
          { label: 'Canada', value: 'CA' },
        ],
      },
    }),
    tollFree: Property.Checkbox({
      displayName: 'Toll Free',
      description: 'Whether to purchase a toll-free number',
      required: false,
      defaultValue: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Specific Phone Number',
      description:
        'Specific phone number to purchase (in E.164 format, e.g., +14157774444)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: any = {
      area_code: propsValue.areaCode,
      inbound_agent_id: propsValue.inboundAgentId,
      outbound_agent_id: propsValue.outboundAgentId,
    };

    if (propsValue.inboundAgentVersion) {
      body.inbound_agent_version = propsValue.inboundAgentVersion;
    }

    if (propsValue.outboundAgentVersion) {
      body.outbound_agent_version = propsValue.outboundAgentVersion;
    }

    if (propsValue.nickname) {
      body.nickname = propsValue.nickname;
    }

    if (propsValue.inboundWebhookUrl) {
      body.inbound_webhook_url = propsValue.inboundWebhookUrl;
    }

    if (propsValue.numberProvider) {
      body.number_provider = propsValue.numberProvider;
    }

    if (propsValue.countryCode) {
      body.country_code = propsValue.countryCode;
    }

    if (propsValue.tollFree !== undefined) {
      body.toll_free = propsValue.tollFree;
    }

    if (propsValue.phoneNumber) {
      body.phone_number = propsValue.phoneNumber;
    }

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/create-phone-number',
      body
    );

    return response;
  },
});
