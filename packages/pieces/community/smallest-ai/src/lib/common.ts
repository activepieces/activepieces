import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const SMALLEST_AI_BASE_URL = 'https://api.smallest.ai';
export const SMALLEST_AI_SOURCE_HEADERS = { 'X-Source': 'activepieces' };

// Canonical Pro voice IDs from https://docs.smallest.ai/waves/model-cards/text-to-speech/lightning-v-3-1-pro
// Used to split the merged /get_voices response into per-model lists.
export const PRO_VOICE_IDS = new Set([
  // Indian
  'rhea', 'zariya', 'kareena', 'mishka', 'inaaya', 'saira', 'meher', 'aarini',
  'aviraj', 'vyom', 'zoravar', 'reyansh', 'ahan',
  // British
  'sophie', 'ellie', 'cressida', 'ottilie', 'elowen', 'seraphina',
  'sam', 'henry', 'benedict', 'cormac', 'rupert', 'finley',
  // American
  'kaitlyn', 'savannah', 'amelia', 'zoe', 'ruby', 'leah', 'jenna', 'kate', 'molly', 'sara', 'fiona',
  'blake', 'austin', 'jack', 'leo', 'luke', 'owen',
]);

export async function getVoices({ apiKey }: { apiKey: string }): Promise<VoiceOption[]> {
  const response = await httpClient.sendRequest<VoicesResponse>({
    method: HttpMethod.GET,
    url: `${SMALLEST_AI_BASE_URL}/waves/v1/lightning-v3.1/get_voices`,
    headers: { Authorization: `Bearer ${apiKey}`, ...SMALLEST_AI_SOURCE_HEADERS },
  });
  return response.body.voices ?? [];
}

export interface VoiceOption {
  voiceId: string;
  displayName: string;
  language?: string;
  gender?: string;
}

interface VoicesResponse {
  voices: VoiceOption[];
}
