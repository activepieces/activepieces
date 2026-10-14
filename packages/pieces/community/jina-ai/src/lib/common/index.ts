import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const JinaAICommon = {
  baseUrl: 'https://api.jina.ai/v1',
  readerUrl: 'https://r.jina.ai',
  readerSearchUrl: 'https://s.jina.ai',
  euReaderUrl: 'https://eu-r-beta.jina.ai',
  euReaderSearchUrl: 'https://eu-s-beta.jina.ai',
  deepsearchUrl: 'https://deepsearch.jina.ai/v1/chat/completions',
  classifierUrl: 'https://api.jina.ai/v1/classify',
  classifierTrainUrl: 'https://api.jina.ai/v1/train',

  toStringList({ values, label }: { values: unknown; label: string }): string[] {
    if (!Array.isArray(values)) {
      return [];
    }
    return values.map((value, index) => {
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${label} ${index + 1} must be a non-empty text.`);
      }
      return value;
    });
  },

  apiUrl({ path }: { path: string }): string {
    return `${JinaAICommon.baseUrl}${path}`;
  },

  async makeRequest({
    url,
    method,
    auth,
    body,
    headers = {},
  }: {
    url: string;
    method: HttpMethod;
    auth: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  }) {
    const response = await httpClient.sendRequest({
      method,
      url,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `Jina AI API returned an error: ${response.status} ${response.body}`
      );
    }

    return response.body;
  },
};
