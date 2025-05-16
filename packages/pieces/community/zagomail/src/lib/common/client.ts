import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.zagomail.com';

export async function makeRequest(auth: string, method: HttpMethod, path: string, body?: unknown) {
  let requestBody: Record<string, unknown> = {};

  // Always include the publicKey in the request body
  requestBody['publicKey'] = auth;

    // Add body properties to requestBody if body exists and is an object
    if (body && typeof body === 'object') {
      requestBody = {
        ...requestBody,
        ...body as Record<string, unknown>,
      };
    }

  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'Content-Type': 'application/json',
    },
    body: requestBody,
  });
  return response.body;
}

export async function getLists(auth: string) {
  const response = await makeRequest(
    auth,
    HttpMethod.GET,
    '/lists/all-lists',
    undefined
  ) as ListsResponse;

  return response;
}

export async function getCampaigns(auth: string) {
  const response = await makeRequest(
    auth,
    HttpMethod.GET,
    '/campaigns/get-campaigns',
    undefined
  ) as CampaignsResponse;

  return response;
}

export interface ListsResponse {
  status: string;
  data: {
    count: string;
    total_pages: number;
    current_page: number;
    next_page: number | null;
    prev_page: number | null;
    records: {
      general: {
        list_uid: string;
        name: string;
        display_name: string;
        description: string;
      };
      [key: string]: any;
    }[];
  };
}

export interface CampaignsResponse {
  status: string;
  data: {
    count: string;
    total_pages: number;
    current_page: number;
    next_page: number | null;
    prev_page: number | null;
    records: {
      campaign_uid: string;
      name: string;
      status: string;
      group: any[];
      [key: string]: any;
    }[];
  };
}
