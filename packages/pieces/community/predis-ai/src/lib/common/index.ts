import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const predisAiCommon = {
  baseUrl: 'https://brain.predis.ai/predis_api/v1',
};

export async function predisAiApiCall<T>(
  apiKey: string,
  method: HttpMethod,
  endpoint: string,
  body?: Record<string, unknown>
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${predisAiCommon.baseUrl}${endpoint}`,
    headers: {
      Authorization: apiKey,
    },
    body,
  });
  return response.body;
}

export const INPUT_LANGUAGES = [
  { label: 'English', value: 'english' },
  { label: 'Malay', value: 'malay' },
  { label: 'Chinese (Traditional)', value: 'chinese (traditional)' },
  { label: 'Croatian', value: 'croatian' },
  { label: 'Dutch', value: 'dutch' },
  { label: 'Indonesian', value: 'indonesian' },
  { label: 'Vietnamese', value: 'vietnamese' },
  { label: 'Portuguese (BR)', value: 'portuguese_br' },
  { label: 'Finnish', value: 'finnish' },
  { label: 'French', value: 'french' },
  { label: 'German', value: 'german' },
  { label: 'Italian', value: 'italian' },
  { label: 'Norwegian', value: 'norwegian' },
  { label: 'Polish', value: 'polish' },
  { label: 'Romanian', value: 'romanian' },
  { label: 'Czech', value: 'czech' },
  { label: 'Spanish', value: 'spanish' },
  { label: 'Swedish', value: 'swedish' },
  { label: 'Turkish', value: 'turkish' },
  { label: 'Danish', value: 'danish' },
  { label: 'Hungarian', value: 'hungarian' },
];

export const OUTPUT_LANGUAGES = INPUT_LANGUAGES;

export const MEDIA_TYPES = [
  { label: 'Single Image', value: 'single_image' },
  { label: 'Carousel', value: 'carousel' },
  { label: 'Video', value: 'video' },
];

export const POST_TYPES = [
  { label: 'Generic', value: 'generic' },
  { label: 'Meme', value: 'meme' },
  { label: 'Quotes', value: 'quotes' },
];

export const MODEL_VERSIONS = [
  { label: 'Version 4 (Higher Quality, supports single_image & carousel)', value: '4' },
  { label: 'Version 2 (Supports all media types)', value: '2' },
];

export const VIDEO_DURATIONS = [
  { label: 'Short', value: 'short' },
  { label: 'Long', value: 'long' },
];

export const COLOR_PALETTE_TYPES = [
  { label: 'AI Suggested', value: 'ai_suggested' },
  { label: 'Brand', value: 'brand' },
];
