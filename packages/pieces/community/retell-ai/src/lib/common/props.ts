import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';
import { Property } from '@activepieces/pieces-framework';

export const agentIdDropdown = (displayName : string) => Property.Dropdown({
  displayName: displayName || 'Agent ID',
  description: 'Select the agent to use',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const agents = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/list-agents'
      );
      return {
        disabled: false,
        options: agents.map((agent: any) => ({
          label: agent.agent_name + ' ' + `(${agent.version})`,
          value: agent.agent_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading teams',
      };
    }
  },
});

export const agentVersionDropdown = (agent_id: string) =>
  Property.Dropdown({
    displayName: 'Agent Version',
    description: 'Select the version of the agent to use',
    required: true,
    refreshers: ['auth', 'agent_id'],
    options: async ({ auth, inbouagent_idndAgentId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
      if (!agent_id) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select an agent first',
        };
      }

      try {
        const agents = await makeRequest(
          auth as string,
          HttpMethod.GET,
          `/get-agent-versions/${agent_id}`
        );
        return {
          disabled: false,
          options: agents.map((agent: any) => ({
            label: `Version ${agent.version}`,
            value: agent.version,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading agent versions',
        };
      }
    },
  });

export const callIdDropdown = Property.Dropdown({
  displayName: 'Call ID',
  description: 'Select the call ID to use',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const calls = await makeRequest(
        auth as string,
        HttpMethod.POST,
        '/v2/list-calls'
      );
      return {
        disabled: false,
        options: calls.map((call: any) => ({
          label: `Call ${call.call_id}`,
          value: call.call_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading calls',
      };
    }
  },
});


export const phoneNumberIdDropdown = Property.Dropdown({
  displayName: 'Phone Number ID',
  description: 'Select the phone number ID to use',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const phoneNumbers = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/list-phone-numbers'
      );
      return {
        disabled: false,
        options: phoneNumbers.map((phoneNumber: any) => ({
          label: `Phone Number ${phoneNumber.id}`,
          value: phoneNumber.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading phone numbers',
      };
    }
  },
});

export const voiceIdDropdown = Property.Dropdown({
  displayName: 'Voice ID',
  description: 'Select the voice ID to use',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const voices = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/list-voices'
      );
      return {
        disabled: false,
        options: voices.map((voice: any) => ({
          label: `Voice ${voice.id}`,
          value: voice.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading voices',
      };
    }
  },
});
