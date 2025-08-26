import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiApiCall } from '../common/client';
import { retellAiAuth } from '../common/auth';
import { agentIdDropdown, numberProviderDropdown } from '../common/props';

export const createPhoneNumber = createAction({
  auth: retellAiAuth,
  name: 'create_phone_number',
  displayName: 'Create Phone Number',
  description: 'Buys a new phone number and binds agents.',
  props: {
    inboundAgentId: agentIdDropdown('Inbound Agent'),
    outboundAgentId: agentIdDropdown('Outbound Agent'),
    inboundAgentVersion: Property.Number({
      displayName: 'Inbound Agent Version',
      description:
        'Version of the inbound agent to bind to the number. If not provided, will default to latest version.',
      required: false,
    }),
    outboundAgentVersion: Property.Number({
      displayName: 'Outbound Agent Version',
      description:
        'Version of the outbound agent to bind to the number. If not provided, will default to latest version.',
      required: false,
    }),
    areaCode: Property.Number({
      displayName: 'Area Code',
      description:
        'Area code of the number to obtain. Format is a 3 digit integer. Currently only supports US area code.',
      required: false,
    }),
    nickname: Property.ShortText({
      displayName: 'Nickname',
      description: 'Nickname of the number. This is for your reference only.',
      required: true,
    }),
    inboundWebhookUrl: Property.ShortText({
      displayName: 'Inbound Webhook URL',
      description:
        'If set, will send a webhook for inbound calls, where you can to override agent id, set dynamic variables and other fields specific to that call.',
      required: false,
    }),
    numberProvider: numberProviderDropdown,
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
      description: 'Whether to purchase a toll-free number. Toll-free numbers incur higher costs.',
      required: false,
      defaultValue: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'The number you are trying to purchase in E.164 format of the number (+country code then number with no space and no special characters).',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const {
      inboundAgentId,
      outboundAgentId,
      inboundAgentVersion,
      outboundAgentVersion,
      areaCode,
      nickname,
      inboundWebhookUrl,
      numberProvider,
      countryCode,
      tollFree,
      phoneNumber,
    } = propsValue;

    // Validate phone number if provided
    if (phoneNumber) {
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(phoneNumber)) {
        throw new Error('Phone Number must be in E.164 format (e.g., +14157774444)');
      }
    }

    const body: Record<string, unknown> = {
      nickname,
    };

    // Add optional fields to the request body
    if (inboundAgentId !== undefined) {
      body['inbound_agent_id'] = inboundAgentId || null;
    }

    if (outboundAgentId !== undefined) {
      body['outbound_agent_id'] = outboundAgentId || null;
    }

    if (inboundAgentVersion !== undefined) {
      body['inbound_agent_version'] = inboundAgentVersion;
    }

    if (outboundAgentVersion !== undefined) {
      body['outbound_agent_version'] = outboundAgentVersion;
    }

    if (areaCode !== undefined) {
      body['area_code'] = areaCode;
    }

    if (inboundWebhookUrl !== undefined) {
      body['inbound_webhook_url'] = inboundWebhookUrl;
    }

    if (numberProvider !== undefined) {
      body['number_provider'] = numberProvider;
    }

    if (countryCode !== undefined) {
      body['country_code'] = countryCode;
    }

    if (tollFree !== undefined) {
      body['toll_free'] = tollFree;
    }

    if (phoneNumber !== undefined) {
      body['phone_number'] = phoneNumber;
    }

    return await retellAiApiCall({
      method: HttpMethod.POST,
      url: '/create-phone-number',
      auth: auth,
      body,
    });
  },
});