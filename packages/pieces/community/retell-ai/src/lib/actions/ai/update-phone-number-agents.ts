import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const updatePhoneNumberAgentsAction = createAction({
  auth: retellAiAuth,
  name: 'update_phone_number_agents',
  classification: 'WRITE',
  displayName: 'Update Phone Number Agents',
  description: 'Changes the agents or nickname of a phone number.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Binds a voice agent for inbound and/or outbound calls on one existing Retell number, or renames it; only fields you set change, and an agent you set replaces all agents on that side. Safe to retry with the same values.',
    idempotent: true,
  },
  props: {
    phone_number: retellAiProps.e164Number({ displayName: 'Phone Number', description: 'The Retell number to change.' }),
    inbound_agent_id: retellAiProps.id({ displayName: 'Inbound Agent ID', description: 'Optional voice agent that answers calls.', required: false }),
    inbound_agent_version: retellAiProps.agentVersion(),
    outbound_agent_id: retellAiProps.id({ displayName: 'Outbound Agent ID', description: 'Optional voice agent for outbound calls.', required: false }),
    outbound_agent_version: Property.ShortText({
      displayName: 'Outbound Agent Version',
      description: 'Optional version number or tag for the outbound agent.',
      required: false,
    }),
    nickname: Property.ShortText({ displayName: 'Nickname', description: 'Optional new nickname.', required: false }),
  },
  outputSchema: retellSchemas.phoneNumber,
  async run({ auth, propsValue }) {
    const phoneNumber = retellInput.e164({ value: propsValue.phone_number, label: 'Phone Number' });
    const body: Record<string, unknown> = {};
    const inbound = retellInput.singleAgent({
      agentId: propsValue.inbound_agent_id,
      version: propsValue.inbound_agent_version,
      label: 'Inbound Agent',
    });
    if (inbound !== undefined) {
      body['inbound_agents'] = inbound;
    }
    const outbound = retellInput.singleAgent({
      agentId: propsValue.outbound_agent_id,
      version: propsValue.outbound_agent_version,
      label: 'Outbound Agent',
    });
    if (outbound !== undefined) {
      body['outbound_agents'] = outbound;
    }
    const nickname = retellInput.optionalText(propsValue.nickname);
    if (nickname !== undefined) {
      body['nickname'] = nickname;
    }
    if (Object.keys(body).length === 0) {
      throw new Error('Set an inbound agent, an outbound agent or a nickname.');
    }
    const number = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.PATCH,
      path: `/update-phone-number/${encodeURIComponent(phoneNumber)}`,
      body,
      retryRateLimit: true,
    });
    return retellMap.phoneNumber(number);
  },
});
