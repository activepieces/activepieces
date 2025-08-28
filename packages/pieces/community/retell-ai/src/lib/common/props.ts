import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { retellAiApiCall } from './client';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { retellAiAuth } from './auth';

interface RetellAiAgent {
  agent_id: string;
  version: number;
  is_published: boolean;
  agent_name: string;
  voice_id: string;
  voice_model?: string;
  fallback_voice_ids?: string[];
  voice_temperature?: number;
  voice_speed?: number;
  volume?: number;
  responsiveness?: number;
  interruption_sensitivity?: number;
  enable_backchannel?: boolean;
  backchannel_frequency?: number;
  backchannel_words?: string[];
  reminder_trigger_ms?: number;
  reminder_max_count?: number;
  ambient_sound?: string;
  ambient_sound_volume?: number;
  language?: string;
  webhook_url?: string;
  boosted_keywords?: string[];
  opt_out_sensitive_data_storage?: boolean;
  opt_in_signed_url?: boolean;
  pronunciation_dictionary?: Array<{
    word: string;
    alphabet: string;
    phoneme: string;
  }>;
  normalize_for_speech?: boolean;
  end_call_after_silence_ms?: number;
  max_call_duration_ms?: number;
  voicemail_option?: {
    action: {
      type: string;
      text: string;
    };
  };
  post_call_analysis_data?: Array<{
    type: string;
    name: string;
    description: string;
    examples: string[];
  }>;
  post_call_analysis_model?: string;
  begin_message_delay_ms?: number;
  ring_duration_ms?: number;
  stt_mode?: string;
  vocab_specialization?: string;
  allow_user_dtmf?: boolean;
  user_dtmf_options?: {
    digit_limit: number;
    termination_key: string;
    timeout_ms: number;
  };
  denoising_mode?: string;
  last_modification_timestamp?: number;
  response_engine?: {
    type: string;
    llm_id: string;
    version: number;
  };
}

type RetellAiAgentListResponse = RetellAiAgent[];

interface RetellAiCall {
  call_id: string;
  agent_id: string;
  call_status: string;
  call_type: string;
  start_timestamp?: number;
  end_timestamp?: number;
}

interface RetellAiVoice {
  voice_id: string;
  voice_name: string;
  provider: string;
  gender: string;
  accent?: string;
  age?: string;
}

// --- Agent Dropdown ---
export const agentIdDropdown = (displayName:string,required=false)=> Property.Dropdown({
  displayName,
  description: 'Select the Retell AI agent.',
  required,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Retell AI account first',
      };
    }
    try {
      const agents = await retellAiApiCall<RetellAiAgentListResponse>({
        auth: auth as PiecePropValueSchema<typeof retellAiAuth>,
        method: HttpMethod.GET,
        url: '/list-agents',
        body: {
          limit: 100,
        }
      });
      const agentList = Array.isArray(agents) ? agents : [];
      if (agentList.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No agents found in your workspace.',
        };
      }
      return {
        disabled: false,
        options: agentList.map((agent) => ({
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

// --- Call ID Dropdown ---
export const callIdDropdown = Property.Dropdown({
  displayName: 'Call ID',
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
      const response = await retellAiApiCall<RetellAiCall[]>({
        auth: auth as PiecePropValueSchema<typeof retellAiAuth>,
        method: HttpMethod.POST,
        url: '/v2/list-calls',
        body: {
          limit: 50,
          sort_order: 'descending'
        }
      });
      
      if (!response || response.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No calls found in your workspace.',
        };
      }
      
      return {
        disabled: false,
        options: response.map((call) => ({
          label: `${call.call_id} (${call.call_status} - ${call.call_type})`,
          value: call.call_id,
        })),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading calls: ${errorMessage}`,
      };
    }
  },
});

// --- Voice Dropdown ---
export const voiceIdDropdown = Property.Dropdown({
  displayName: 'Voice',
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