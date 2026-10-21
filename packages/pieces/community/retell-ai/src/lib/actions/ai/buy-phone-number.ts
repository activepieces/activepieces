import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
import { buildBuyNumberBody } from '../create-phone-number';

export const buyPhoneNumberAction = createAction({
  auth: retellAiAuth,
  name: 'buy_phone_number',
  classification: 'WRITE',
  displayName: 'Buy Phone Number',
  description: 'Buys a new US or Canadian phone number.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Buys a new Retell phone number by area code or exact number (US/CA) and optionally binds inbound/outbound voice agents. Adds a monthly fee per number; each run buys another number, so never retry blindly. Use Update Phone Number Agents to rebind an existing number.',
    idempotent: false,
  },
  props: {
    area_code: Property.Number({
      displayName: 'Area Code',
      description: 'Optional 3-digit US area code. Set this or Phone Number, not both.',
      required: false,
    }),
    phone_number: retellAiProps.e164Number({
      displayName: 'Phone Number',
      description: 'Optional exact number to buy. Set this or Area Code, not both.',
      required: false,
    }),
    country_code: Property.StaticDropdown({
      displayName: 'Country',
      required: false,
      options: { options: [{ label: 'United States', value: 'US' }, { label: 'Canada', value: 'CA' }] },
    }),
    toll_free: Property.Checkbox({ displayName: 'Toll Free', description: 'Buy a toll-free number (higher cost).', required: false }),
    inbound_agent_id: retellAiProps.id({ displayName: 'Inbound Agent ID', description: 'Optional voice agent that answers calls.', required: false }),
    outbound_agent_id: retellAiProps.id({ displayName: 'Outbound Agent ID', description: 'Optional voice agent used for calls from this number.', required: false }),
    nickname: Property.ShortText({ displayName: 'Nickname', description: 'Optional name for your reference.', required: false }),
  },
  outputSchema: retellSchemas.phoneNumber,
  async run({ auth, propsValue }) {
    const number = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.POST,
      path: '/create-phone-number',
      body: buildBuyNumberBody({
        inboundAgentId: propsValue.inbound_agent_id,
        inboundAgentVersion: undefined,
        outboundAgentId: propsValue.outbound_agent_id,
        outboundAgentVersion: undefined,
        areaCode: propsValue.area_code,
        phoneNumber: propsValue.phone_number,
        nickname: propsValue.nickname,
        inboundWebhookUrl: undefined,
        numberProvider: undefined,
        countryCode: propsValue.country_code,
        tollFree: propsValue.toll_free,
      }),
    });
    return retellMap.phoneNumber(number);
  },
});
