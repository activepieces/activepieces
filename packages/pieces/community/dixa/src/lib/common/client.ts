import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const DIXA_API_BASE_URL = 'https://dev.dixa.io/v1';

export type DixaListResponse<T> = {
  data: T[];
};

export type DixaItemResponse<T> = {
  data: T;
};

export type DixaEndUser = {
  id: string;
  displayName?: string;
};

export type DixaAgent = {
  id: string;
  displayName?: string;
};

export type DixaConversation = {
  id: number;
  direction?: string;
  toEmail?: string;
  fromEmail?: string;
};

export type DixaTag = {
  id: string;
  name: string;
  state?: string;
};

export type DixaContactEndpoint = {
  _type: string;
  address: string;
};

export type DixaSelectOption = {
  label: string;
  value: string;
  nestedOptions?: DixaSelectOption[];
};

export type DixaCustomAttribute = {
  id: string;
  label: string;
  description?: string;
  isDeactivated?: boolean;
  isArchived?: boolean;
  entityType?: string;
  isRequired?: boolean;
  inputDefinition: {
    _type: string;
    placeholder?: string;
    options?: DixaSelectOption[];
  };
};

export const dixaClient = {
  async makeRequest<T>(
    apiKey: string,
    method: HttpMethod,
    endpoint: string,
    body?: unknown,
    queryParams?: Record<string, string>
  ): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${DIXA_API_BASE_URL}${endpoint}`,
      headers: {
        Authorization: apiKey,
      },
      body,
      queryParams,
    });
    return response.body;
  },
};

export async function fetchAllPages<T>(
  apiKey: string,
  endpoint: string,
  queryParams?: Record<string, string>
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;

  while (true) {
    const response = await dixaClient.makeRequest<DixaListResponse<T>>(
      apiKey,
      HttpMethod.GET,
      endpoint,
      undefined,
      {
        ...queryParams,
        page: String(page),
      }
    );

    items.push(...response.data);

    if (response.data.length === 0) {
      break;
    }

    page += 1;
    if (page > 50) {
      break;
    }
  }

  return items;
}
