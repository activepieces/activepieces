import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const SMALLEST_AI_BASE_URL = 'https://api.smallest.ai';
export const SMALLEST_AI_SOURCE_HEADERS = { 'X-Source': 'activepieces' };

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
