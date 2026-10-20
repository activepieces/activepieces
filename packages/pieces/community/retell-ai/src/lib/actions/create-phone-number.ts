import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../common/auth';
import { apiKeyOf, retellApiCall } from '../common/client';
import { retellInput } from '../common/input';
import { agentIdDropdown, numberProviderDropdown } from '../common/props';
import { retellSchemas } from '../common/schemas';

export const createPhoneNumber = createAction({
  auth: retellAiAuth,
  name: 'create_phone_number',
  classification: 'WRITE',
  displayName: 'Create Phone Number',
  description: 'Buys a new phone number and binds agents.',
  audience: 'human',
  aiMetadata: {
    description:
      'Buys a new Retell phone number (monthly fee) and binds inbound/outbound agents. Each run buys another number.',
    idempotent: false,
  },
  props: {
    inboundAgentId: agentIdDropdown({ displayName: 'Inbound Agent' }),
    outboundAgentId: agentIdDropdown({ displayName: 'Outbound Agent' }),
    inboundAgentVersion: Property.Number({
      displayName: 'Inbound Agent Version',
      description: 'Version of the inbound agent to bind to the number. If not provided, will default to latest version.',
      required: false,
    }),
    outboundAgentVersion: Property.Number({
      displayName: 'Outbound Agent Version',
      description: 'Version of the outbound agent to bind to the number. If not provided, will default to latest version.',
      required: false,
    }),
    areaCode: Property.Number({
      displayName: 'Area Code',
      description: '3-digit US area code. Leave empty when Phone Number is set.',
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
      description: 'Exact E.164 number to buy. Leave empty when Area Code is set.',
      required: false,
    }),
  },
  outputSchema: retellSchemas.rawPhoneNumber,
  async run({ propsValue, auth }) {
    return retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.POST,
      path: '/create-phone-number',
      body: buildBuyNumberBody({
        inboundAgentId: propsValue.inboundAgentId,
        inboundAgentVersion: propsValue.inboundAgentVersion,
        outboundAgentId: propsValue.outboundAgentId,
        outboundAgentVersion: propsValue.outboundAgentVersion,
        areaCode: propsValue.areaCode,
        phoneNumber: propsValue.phoneNumber,
        nickname: propsValue.nickname,
        inboundWebhookUrl: propsValue.inboundWebhookUrl,
        numberProvider: propsValue.numberProvider,
        countryCode: propsValue.countryCode,
        tollFree: propsValue.tollFree,
      }),
    });
  },
});

export function buildBuyNumberBody(input: {
  inboundAgentId: unknown;
  inboundAgentVersion: unknown;
  outboundAgentId: unknown;
  outboundAgentVersion: unknown;
  areaCode: unknown;
  phoneNumber: unknown;
  nickname: unknown;
  inboundWebhookUrl: unknown;
  numberProvider: unknown;
  countryCode: unknown;
  tollFree: unknown;
}): Record<string, unknown> {
  const areaCode = retellInput.optionalInteger({ value: input.areaCode, label: 'Area Code', min: 100, max: 999 });
  const phoneNumber = retellInput.optionalE164({ value: input.phoneNumber, label: 'Phone Number' });
  if (areaCode !== undefined && phoneNumber !== undefined) {
    throw new Error('Set either Area Code or Phone Number, not both.');
  }
  const body: Record<string, unknown> = {};
  const inbound = retellInput.singleAgent({ agentId: input.inboundAgentId, version: input.inboundAgentVersion, label: 'Inbound Agent' });
  if (inbound !== undefined) {
    body['inbound_agents'] = inbound;
  }
  const outbound = retellInput.singleAgent({ agentId: input.outboundAgentId, version: input.outboundAgentVersion, label: 'Outbound Agent' });
  if (outbound !== undefined) {
    body['outbound_agents'] = outbound;
  }
  if (areaCode !== undefined) {
    body['area_code'] = areaCode;
  }
  if (phoneNumber !== undefined) {
    body['phone_number'] = phoneNumber;
  }
  const nickname = retellInput.optionalText(input.nickname);
  if (nickname !== undefined) {
    body['nickname'] = nickname;
  }
  const webhookUrl = retellInput.optionalText(input.inboundWebhookUrl);
  if (webhookUrl !== undefined) {
    body['inbound_webhook_url'] = webhookUrl;
  }
  const provider = retellInput.optionalText(input.numberProvider);
  if (provider !== undefined) {
    body['number_provider'] = provider;
  }
  const country = retellInput.optionalText(input.countryCode);
  if (country !== undefined) {
    body['country_code'] = country;
  }
  if (typeof input.tollFree === 'boolean') {
    body['toll_free'] = input.tollFree;
  }
  return body;
}
