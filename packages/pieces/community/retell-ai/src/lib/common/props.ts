import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { retellAiAuth } from './auth';
import { apiKeyOf, retellApiCall } from './client';
import { retellMap } from './mappers';

export async function listAllAgents({ apiKey, channel }: { apiKey: string; channel?: 'voice' | 'chat' }) {
  const agents: { agent_id: string; agent_name: string | null }[] = [];
  const seen = new Set<string>();
  let paginationKey: string | null = null;
  for (let pageIndex = 0; pageIndex < MAX_DROPDOWN_PAGES; pageIndex++) {
    const body: unknown = await retellApiCall({
      apiKey,
      method: HttpMethod.POST,
      path: '/v2/list-agents',
      query: { limit: 1000, pagination_key: paginationKey },
      body: channel === undefined ? {} : { filter_criteria: { channel: { type: 'string', op: 'eq', value: channel } } },
      retryRateLimit: true,
    });
    const page = retellMap.page({ body, mapItem: retellMap.agentListItem });
    for (const agent of page.items) {
      if (agent.agent_id !== null && !seen.has(agent.agent_id)) {
        seen.add(agent.agent_id);
        agents.push({ agent_id: agent.agent_id, agent_name: agent.agent_name });
      }
    }
    if (!page.has_more || page.pagination_key === null || page.pagination_key === paginationKey) {
      return { agents, truncated: false };
    }
    paginationKey = page.pagination_key;
  }
  return { agents, truncated: true };
}

export const agentIdDropdown = ({ displayName, required = false }: { displayName: string; required?: boolean }) =>
  Property.Dropdown({
    auth: retellAiAuth,
    displayName,
    description: 'Select the Retell AI agent.',
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Retell AI account first' };
      }
      try {
        const { agents } = await listAllAgents({ apiKey: apiKeyOf(auth), channel: 'voice' });
        if (agents.length === 0) {
          return { disabled: true, options: [], placeholder: 'No voice agents found in your workspace.' };
        }
        return {
          disabled: false,
          options: agents.map((agent) => ({
            label: `${agent.agent_name || 'Unnamed Agent'} (${agent.agent_id})`,
            value: agent.agent_id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: `Error loading agents: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

export const callIdDropdown = Property.Dropdown({
  auth: retellAiAuth,
  displayName: 'Call ID',
  description: 'The 100 most recent calls. Map a Call ID from an earlier step for older calls.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Connect your Retell AI account first' };
    }
    try {
      const body: unknown = await retellApiCall({
        apiKey: apiKeyOf(auth),
        method: HttpMethod.POST,
        path: '/v3/list-calls',
        body: { limit: 100, sort_order: 'descending' },
        retryRateLimit: true,
      });
      const calls = retellMap.itemsOf(body).map(retellMap.call);
      if (calls.length === 0) {
        return { disabled: true, options: [], placeholder: 'No calls found in your workspace.' };
      }
      return {
        disabled: false,
        options: calls
          .filter((call) => call.call_id !== null)
          .map((call) => ({
            label: `${call.call_id} (${call.call_status ?? 'unknown'} - ${call.call_type ?? 'call'}${call.start_time ? `, ${call.start_time}` : ''})`,
            value: call.call_id ?? '',
          })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading calls: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

export const voiceIdDropdown = Property.Dropdown({
  auth: retellAiAuth,
  displayName: 'Voice',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Connect your Retell AI account first' };
    }
    try {
      const body: unknown = await retellApiCall({
        apiKey: apiKeyOf(auth),
        method: HttpMethod.GET,
        path: '/list-voices',
        retryRateLimit: true,
      });
      const voices = retellMap.itemsOf(body).map(retellMap.voice);
      if (voices.length === 0) {
        return { disabled: true, options: [], placeholder: 'No voices found in your workspace.' };
      }
      return {
        disabled: false,
        options: voices
          .filter((voice) => voice.voice_id !== null)
          .map((voice) => {
            const info = [voice.gender, voice.accent].filter((part) => part !== null).join(', ');
            return { label: `${voice.voice_name ?? voice.voice_id}${info ? ` (${info})` : ''}`, value: voice.voice_id ?? '' };
          }),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading voices: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

export const numberProviderDropdown = Property.StaticDropdown({
  displayName: 'Number Provider',
  description: 'The provider to purchase the phone number from.',
  required: false,
  options: {
    options: [
      { label: 'Twilio', value: 'twilio' },
      { label: 'Telnyx', value: 'telnyx' },
    ],
  },
  defaultValue: 'twilio',
});

const MAX_DROPDOWN_PAGES = 10;
