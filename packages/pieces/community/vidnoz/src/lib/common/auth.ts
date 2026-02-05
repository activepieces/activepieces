import {
  AuthenticationType,
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';

export const vidnozAuth = (auth: string) => ({
  type: AuthenticationType.BEARER_TOKEN as const,
  token: auth,
});

type VidnozListTemplatesResponse = {
  code: number;
  message: string;
  data?: {
    templates?: Array<{
      id: string;
      name: string;
      aspect: number;
      scenes: number;
      preview_image_url: string;
      preview_video_url: string;
    }>;
  };
};

export const vidnozClient = {
  async makeRequest<T = any>(
    auth: string,
    request: Omit<HttpRequest, 'authentication'>
  ): Promise<T> {
    const httpRequest: HttpRequest = {
      ...request,
      authentication: vidnozAuth(auth),
      url: `https://devapi.vidnoz.com${request.url}`,
    };

    const response = await httpClient.sendRequest<T>(httpRequest);

    if (response.status >= 400) {
      throw new Error(
        `Vidnoz API request failed with status ${response.status}: ${JSON.stringify(
          response.body
        )}`
      );
    }

    return response.body;
  },

  async testConnection(auth: string): Promise<boolean> {
    try {
      const response = await this.makeRequest<VidnozListTemplatesResponse>(auth, {
        url: '/v2/template/list',
        method: HttpMethod.GET,
        queryParams: {
          personal: 'false',
          limit: '1',
        },
      });

      return response.code === 200;
    } catch (error) {
      return false;
    }
  },
};
