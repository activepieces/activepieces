import { Property, HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-framework';

export const canvaCommon = {
  baseUrl: 'https://api.canva.com/v1',

  designId: Property.ShortText({
    displayName: 'Design ID',
    description: 'The ID of the Canva design.',
    required: true,
  }),
  folderId: Property.ShortText({
    displayName: 'Folder ID',
    description: 'The ID of the Canva folder.',
    required: true,
  }),
  assetId: Property.ShortText({
    displayName: 'Asset ID',
    description: 'The ID of the Canva asset (e.g., image).',
    required: true,
  }),

  // Helper function to make authenticated Canva API requests
  async makeRequest(auth: string, method: HttpMethod, url: string, body?: any, queryParams?: Record<string, any>) {
    const response = await httpClient.sendRequest({
      method: method,
      url: `${canvaCommon.baseUrl}${url}`,
      headers: {
        'Content-Type': 'application/json',
      },
      queryParams: queryParams,
      body: body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
    });
    return response.body;
  },
};
