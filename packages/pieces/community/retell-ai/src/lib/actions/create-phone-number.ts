import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../common/auth';
import { retellAiApi } from '../common/api';
import { retellAiCommon } from '../common/props';

export const createPhoneNumber = createAction({
  auth: retellAiAuth,
  name: 'create_phone_number',
  displayName: 'Create a Phone Number',
  description: 'Buy a new phone number and bind agents for inbound/outbound calls',
  props: {
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number to purchase (e.g., +14157774444)',
      required: true,
    }),
    inbound_agent_id: Property.Dropdown({
      displayName: 'Inbound Agent ID',
      description: 'The agent ID to handle incoming calls to this number',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }

        try {
          const agents = await retellAiApi.get<{ agents: Array<{ agent_id: string; agent_name: string }> }>(
            '/v2/agents',
            auth as string
          );

          return {
            disabled: false,
            options: agents.agents.map((agent) => ({
              label: agent.agent_name || agent.agent_id,
              value: agent.agent_id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load agents',
            options: [],
          };
        }
      },
    }),
    outbound_agent_id: Property.Dropdown({
      displayName: 'Outbound Agent ID',
      description: 'The agent ID to handle outgoing calls from this number',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }

        try {
          const agents = await retellAiApi.get<{ agents: Array<{ agent_id: string; agent_name: string }> }>(
            '/v2/agents',
            auth as string
          );

          return {
            disabled: false,
            options: agents.agents.map((agent) => ({
              label: agent.agent_name || agent.agent_id,
              value: agent.agent_id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load agents',
            options: [],
          };
        }
      },
    }),
    inbound_agent_version: Property.Number({
      displayName: 'Inbound Agent Version',
      description: 'Version of the inbound agent to use (optional)',
      required: false,
    }),
    outbound_agent_version: Property.Number({
      displayName: 'Outbound Agent Version',
      description: 'Version of the outbound agent to use (optional)',
      required: false,
    }),
    nickname: Property.ShortText({
      displayName: 'Nickname',
      description: 'A friendly name for the phone number (e.g., "Frontdesk Number")',
      required: false,
    }),
    inbound_webhook_url: Property.ShortText({
      displayName: 'Inbound Webhook URL',
      description: 'Webhook URL for inbound call events (optional)',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Additional metadata for the phone number (JSON object)',
      required: false,
    }),
  },
  async run(context) {
    const {
      phone_number,
      inbound_agent_id,
      outbound_agent_id,
      inbound_agent_version,
      outbound_agent_version,
      nickname,
      inbound_webhook_url,
      metadata,
    } = context.propsValue;

    const payload = {
      phone_number,
      inbound_agent_id,
      outbound_agent_id,
      ...(inbound_agent_version && { inbound_agent_version }),
      ...(outbound_agent_version && { outbound_agent_version }),
      ...(nickname && { nickname }),
      ...(inbound_webhook_url && { inbound_webhook_url }),
      ...(metadata && { metadata }),
    };

    try {
      const response = await retellAiApi.post('/v2/create-phone-number', context.auth, payload);
      
      return {
        success: true,
        phone_number: response.phone_number,
        phone_number_type: response.phone_number_type,
        phone_number_pretty: response.phone_number_pretty,
        inbound_agent_id: response.inbound_agent_id,
        outbound_agent_id: response.outbound_agent_id,
        inbound_agent_version: response.inbound_agent_version,
        outbound_agent_version: response.outbound_agent_version,
        area_code: response.area_code,
        nickname: response.nickname,
        inbound_webhook_url: response.inbound_webhook_url,
        last_modification_timestamp: response.last_modification_timestamp,
        message: 'Phone number created successfully',
      };
    } catch (error) {
      throw new Error(`Failed to create phone number: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
