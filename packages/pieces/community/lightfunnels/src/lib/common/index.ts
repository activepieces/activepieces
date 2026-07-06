import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const lightfunnelsCommon = {
  baseUrl: 'https://services.lightfunnels.com/api/v2',

  async makeGraphQLRequest<T = any>(
    auth: OAuth2PropertyValue,
    query: string,
    variables?: Record<string, any>,
  ): Promise<{ data: T }> {
    const response = await httpClient.sendRequest<{ data: T; errors?: any[] }>({
      method: HttpMethod.POST,
      url: this.baseUrl,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        query,
        variables,
      },
    });

    if (response.body.errors) {
      throw new Error(JSON.stringify(response.body.errors));
    }

    return response.body;
  },
};
