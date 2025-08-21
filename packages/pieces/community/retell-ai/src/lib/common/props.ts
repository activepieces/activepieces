import { Property } from '@activepieces/pieces-framework';
import { retellAiApi } from './api';

export const retellAiCommon = {
  from_number: Property.ShortText({
    displayName: 'From Number',
    description: 'The phone number to call from (must be a verified Retell AI number)',
    required: true,
  }),

  to_number: Property.ShortText({
    displayName: 'To Number',
    description: 'The phone number to call',
    required: true,
  }),

  agent_id: Property.Dropdown({
    displayName: 'Agent ID',
    description: 'The Retell AI agent to use for the call',
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

  phone_number: Property.ShortText({
    displayName: 'Phone Number',
    description: 'The phone number to manage',
    required: true,
  }),

  voice_id: Property.Dropdown({
    displayName: 'Voice ID',
    description: 'The voice model to use',
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
        const voices = await retellAiApi.get<{ voices: Array<{ voice_id: string; voice_name: string }> }>(
          '/v2/voices',
          auth as string
        );

        return {
          disabled: false,
          options: voices.voices.map((voice) => ({
            label: voice.voice_name || voice.voice_id,
            value: voice.voice_id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to load voices',
          options: [],
        };
      }
    },
  }),

  call_id: Property.ShortText({
    displayName: 'Call ID',
    description: 'The unique identifier of the call',
    required: true,
  }),
};
