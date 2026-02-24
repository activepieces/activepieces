import { Property } from '@activepieces/pieces-framework';
import { getLettaClient } from './client';
import { lettaAuth, type LettaAuthType } from './auth';


export const identityIdsDropdown = Property.MultiSelectDropdown({
  displayName: 'Identities',
  description: 'Select identities to assign to the agent',
  auth: lettaAuth,
  required: false,
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
      const client = getLettaClient(auth as LettaAuthType);
      const identitiesPage = await client.identities.list();

      const identities: Array<{ label: string; value: string }> = [];
      for await (const identity of identitiesPage) {
        identities.push({
          label: identity.name || identity.identifier_key || identity.id,
          value: identity.id,
        });
      }

      if (identities.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No identities found',
        };
      }

      return {
        disabled: false,
        options: identities,
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load identities. Please check your connection.',
        options: [],
      };
    }
  },
});


export const agentIdDropdown = Property.Dropdown({
  auth: lettaAuth,
  displayName: 'Agent',
  description: 'Select the agent to send a message to',
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
      const client = getLettaClient(auth as LettaAuthType);
      const agentsPage = await client.agents.list();

      const agents: Array<{ label: string; value: string }> = [];
      for await (const agent of agentsPage) {
        agents.push({
          label: agent.name || agent.id,
          value: agent.id,
        });
      }

      if (agents.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No agents found',
        };
      }

      return {
        disabled: false,
        options: agents,
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load agents. Please check your connection.',
        options: [],
      };
    }
  },
});
