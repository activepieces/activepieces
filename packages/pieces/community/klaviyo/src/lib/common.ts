import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const klaviyoCommon = {
  baseUrl: 'https://a.klaviyo.com/api',

  async makeRequest(apiKey: string, endpoint: string, method: HttpMethod = HttpMethod.GET, body?: unknown) {
    const response = await httpClient.sendRequest({
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Revision': '2024-10-15',
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
      },
      body,
    });
    return response.body;
  },

  // Helper to get paginated results (cursor-based)
  async *paginate(apiKey: string, endpoint: string, pageSize = 100) {
    let cursor: string | null = null;
    while (true) {
      const params = new URLSearchParams();
      params.append('page[size]', pageSize.toString());
      if (cursor) {
        params.append('page[cursor]', cursor);
      }
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${this.baseUrl}${endpoint}?${params.toString()}`,
        headers: {
          'Accept': 'application/json',
          'Revision': '2024-10-15',
          'Authorization': `Klaviyo-API-Key ${apiKey}`,
        },
      });
      const data = response.body.data;
      const links = response.body.links;
      yield* data;
      if (!links?.next) {
        break;
      }
      // Extract cursor from next URL
      const nextUrl = new URL(links.next);
      cursor = nextUrl.searchParams.get('page[cursor]');
      if (!cursor) break;
    }
  },
};