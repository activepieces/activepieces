import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const API_BASE_URL = 'https://api.magicslides.app/v1';

export interface Presentation {
  presentation_id: string;
  status: 'done' | 'processing' | 'error';
  download_url?: string;
  view_url?: string;
  error_message?: string;
}

export const MagicSlidesClient = {
  async generate(params: {
    accessId: string;
    endpoint: string;
    body: Record<string, unknown>;
  }): Promise<string> {
    const response = await httpClient.sendRequest<{ presentation_id: string }>({
      method: HttpMethod.POST,
      url: `${API_BASE_URL}/presentations/${params.endpoint}`,
      body: {
        ...params.body,
        accessId: params.accessId, 
      },
    });
    return response.body.presentation_id;
  },

  async pollForResult(
    accessId: string,
    presentationId: string
  ): Promise<Presentation> {
    const POLLING_INTERVAL_MS = 5000; 
    const MAX_ATTEMPTS = 36; 

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const response = await httpClient.sendRequest<Presentation>({
        method: HttpMethod.GET,
        url: `${API_BASE_URL}/presentations/${presentationId}`,
        body: {
          accessId: accessId,
        },
      });

      if (response.body.status === 'done') {
        return response.body;
      }

      if (response.body.status === 'error') {
        throw new Error(
          `Presentation generation failed: ${response.body.error_message}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL_MS));
    }

    throw new Error('Presentation generation timed out after 3 minutes.');
  },
};
