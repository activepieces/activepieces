import { Property } from '@activepieces/pieces-framework';
import { lettaApi } from './client';
import { lettaAuth } from './auth';

const DROPDOWN_PAGE_SIZE = 100;
const DROPDOWN_MAX_ITEMS = 1000;

function agentDropdown({ description }: { description: string }) {
  return Property.Dropdown({
    auth: lettaAuth,
    displayName: 'Agent',
    description,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      }
      try {
        const client = await lettaApi.getLettaClient({ auth: auth.props });
        const agents: Array<{ label: string; value: string }> = [];
        for await (const agent of client.agents.list({ limit: DROPDOWN_PAGE_SIZE })) {
          agents.push({ label: agent.name || agent.id, value: agent.id });
          if (agents.length >= DROPDOWN_MAX_ITEMS) {
            break;
          }
        }
        if (agents.length === 0) {
          return { disabled: false, options: [], placeholder: 'No agents found' };
        }
        return { disabled: false, options: agents };
      } catch (error) {
        return {
          disabled: true,
          placeholder: `Failed to load agents: ${errorMessage(error)}`,
          options: [],
        };
      }
    },
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function aiId({ displayName, description }: { displayName: string; description: string }) {
  return Property.ShortText({ displayName, description, required: true });
}

function aiLimit({ max }: { max: number }) {
  return Property.Number({
    displayName: 'Limit',
    description: `Maximum number of items to return (1-${max}). Defaults to 50.`,
    required: false,
  });
}

function aiAfter() {
  return Property.ShortText({
    displayName: 'After (Cursor)',
    description: 'Return items after this ID. Pass the next_cursor value from a previous call to get the next page.',
    required: false,
  });
}

function aiOrder() {
  return Property.StaticDropdown<string, false>({
    displayName: 'Order',
    description: 'Sort order by creation time. Defaults to newest first (desc).',
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'Newest first', value: 'desc' },
        { label: 'Oldest first', value: 'asc' },
      ],
    },
  });
}

function aiYesNo({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown<string, false>({
    displayName,
    description,
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  });
}

function identityTypeDropdown({ required }: { required: boolean }) {
  return Property.StaticDropdown<string, typeof required>({
    displayName: 'Identity Type',
    description: 'The type of the identity: org, user or other.',
    required,
    options: {
      disabled: false,
      options: [
        { label: 'Organization', value: 'org' },
        { label: 'User', value: 'user' },
        { label: 'Other', value: 'other' },
      ],
    },
  });
}

function toIdentityType(value: string | undefined | null): 'org' | 'user' | 'other' | undefined {
  if (value === 'org' || value === 'user' || value === 'other') {
    return value;
  }
  return undefined;
}

function toOrder(value: string | undefined | null): 'asc' | 'desc' {
  return value === 'asc' ? 'asc' : 'desc';
}

export const identityIdsDropdown = Property.MultiSelectDropdown({
  displayName: 'Identities',
  description: 'Select identities to assign to the agent',
  auth: lettaAuth,
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    }
    try {
      const client = await lettaApi.getLettaClient({ auth: auth.props });
      const identities: Array<{ label: string; value: string }> = [];
      for await (const identity of await lettaApi.callLetta(() => client.identities.list({ limit: DROPDOWN_PAGE_SIZE }))) {
        identities.push({
          label: identity.name || identity.identifier_key || identity.id,
          value: identity.id,
        });
        if (identities.length >= DROPDOWN_MAX_ITEMS) {
          break;
        }
      }
      if (identities.length === 0) {
        return { disabled: false, options: [], placeholder: 'No identities found' };
      }
      return { disabled: false, options: identities };
    } catch (error) {
      if (lettaApi.isLettaApiError(error) && error.status === 404) {
        return {
          disabled: true,
          placeholder: 'Identities are not available: Letta Cloud no longer supports them. Leave this empty.',
          options: [],
        };
      }
      return {
        disabled: true,
        placeholder: `Failed to load identities: ${errorMessage(error)}`,
        options: [],
      };
    }
  },
});

export const agentIdDropdown = agentDropdown({ description: 'Select the agent to send a message to' });

export const watchedAgentDropdown = agentDropdown({ description: 'Agent to watch for new replies' });

export const lettaProps = {
  aiId,
  aiLimit,
  aiAfter,
  aiOrder,
  aiYesNo,
  identityTypeDropdown,
  toIdentityType,
  toOrder,
};
