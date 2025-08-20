import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { retellAiApiCall } from './client';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { retellAiAuth } from './auth';

// --- Interfaces for Agent Dropdown ---
interface RetellAiAgent {
  agent_id: string;
  version: number;
  is_published: boolean;
  agent_name: string;
  voice_id: string;
}

interface RetellAiAgentListResponse {
  items: RetellAiAgent[];
}

// --- Interfaces for Voice Dropdown ---
interface RetellAiVoice {
  voice_id: string;
  voice_name: string;
  provider: string;
  gender: string;
  accent?: string;
  age?: string;
}

// --- Agent Dropdown ---
export const agentIdDropdown = Property.Dropdown({
  displayName: 'Agent',
  description: 'Select the Retell AI agent.',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Retell AI account first',
      };
    }
    try {
      const response = await retellAiApiCall<RetellAiAgentListResponse>({
        auth: auth as PiecePropValueSchema<typeof retellAiAuth>,
        method: HttpMethod.GET,
        url: '/list-agents',
      });
      const agents = response.items;
      if (agents.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No agents found in your workspace.',
        };
      }
      return {
        disabled: false,
        options: agents.map((agent) => ({
          label: `${agent.agent_name || 'Unnamed Agent'} (${agent.agent_id})`,
          value: agent.agent_id,
        })),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading agents: ${errorMessage}`,
      };
    }
  },
});

// --- Voice Dropdown ---
export const voiceIdDropdown = Property.Dropdown({
  displayName: 'Voice',
  description: 'Select the Retell AI voice.',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Retell AI account first',
      };
    }
    try {
      const response = await retellAiApiCall<RetellAiVoice[]>({
        auth: auth as PiecePropValueSchema<typeof retellAiAuth>,
        method: HttpMethod.GET,
        url: '/list-voices',
      });
      const voices = response;
      if (voices.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No voices found in your workspace.',
        };
      }
      return {
        disabled: false,
        options: voices.map((voice) => {
          const voiceInfo = voice.accent ? `${voice.gender}, ${voice.accent}` : voice.gender;
          return {
            label: `${voice.voice_name} (${voiceInfo})`,
            value: voice.voice_id,
          };
        }),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading voices: ${errorMessage}`,
      };
    }
  },
});

// --- Number Provider Dropdown ---
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

// --- Country Code Dropdown ---
export const countryCodeDropdown = Property.StaticDropdown({
  displayName: 'Country Code',
  description:
    'The ISO 3166-1 alpha-2 country code of the number you are trying to purchase.',
  required: false,
  options: {
    options: [
      { label: 'United States', value: 'US' },
      { label: 'Canada', value: 'CA' },
    ],
  },
  defaultValue: 'US',
});

// --- Language Dropdown ---
export const languageDropdown = Property.StaticDropdown({
  displayName: 'Language',
  description: 'The language for the agent to use.',
  required: false,
  options: {
    options: [
      { label: 'English (US)', value: 'en-US' },
      { label: 'English (UK)', value: 'en-GB' },
      { label: 'Spanish', value: 'es-ES' },
      { label: 'French', value: 'fr-FR' },
      { label: 'German', value: 'de-DE' },
      { label: 'Italian', value: 'it-IT' },
      { label: 'Portuguese', value: 'pt-PT' },
      { label: 'Dutch', value: 'nl-NL' },
      { label: 'Japanese', value: 'ja-JP' },
      { label: 'Chinese (Mandarin)', value: 'zh-CN' },
    ],
  },
  defaultValue: 'en-US',
});

// --- STT Mode Dropdown ---
export const sttModeDropdown = Property.StaticDropdown({
  displayName: 'Speech-to-Text Mode',
  description: 'The speech-to-text mode for the agent.',
  required: false,
  options: {
    options: [
      { label: 'Fast', value: 'fast' },
      { label: 'Standard', value: 'standard' },
    ],
  },
  defaultValue: 'fast',
});

// --- Denoising Mode Dropdown ---
export const denoisingModeDropdown = Property.StaticDropdown({
  displayName: 'Denoising Mode',
  description: 'The denoising mode for audio processing.',
  required: false,
  options: {
    options: [
      { label: 'Noise Cancellation', value: 'noise-cancellation' },
      { label: 'None', value: 'none' },
    ],
  },
  defaultValue: 'noise-cancellation',
});