import { PieceAuth, Property, PropertyType } from '@activepieces/pieces-framework';
import { HttpMethod, HttpMessageBody, HttpRequest, httpClient, QueryParams } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.short.io'

export type ShortioApiCallParams = {
	apiKey: string;
	method: HttpMethod;
	resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
	body?: any;
};

export type ShortioApiDomain = {
  id: number;
  hostname: string;
  unicodeHostname: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  hasFavicon: boolean;
  hideReferer: boolean;
  linkType: string;
  cloaking: boolean;
  hideVisitorIp: boolean;
  enableAI: boolean;
  httpsLevel: string;
  httpsLinks: boolean;
  clientStorage: Record<string, any>;
  caseSensitive: boolean;
  incrementCounter: string;
  robots: string;
  exportEnabled: boolean;
  enableConversionTracking: boolean;
  qrScanTracking: boolean;
  isFavorite: boolean;
  TeamId: number | null;
  segmentKey: string;
  webhookURL: string;
  integrationGA: string;
  integrationFB: string;
  integrationTT: string;
  integrationAdroll: string;
  integrationGTM: string;
  sslCertExpirationDate: string;
  sslCertInstalledSuccess: boolean;
}

export type ShortioApiLink = {
  count: number;
  links: Array<{
    id: string;
    idString: string;
    originalURL: string;
    shortURL: string;
    secureShortURL: string;
    path: string;
    title?: string;
    tags: string[];
    createdAt: string;
    archived: boolean;
    cloaking: boolean;
    skipQS: boolean;
    hasPassword: boolean;
    DomainId: number;
    OwnerId: number;
    User: {
      id: number;
      name: string;
      email: string;
      photoURL?: string;
    };
    [key: string]: any;
  }>;
  nextPageToken?: string;
}

export const shortioAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `Enter your Short.io API key. You can get your API key from the [Short.io Dashboard](https://app.short.io/settings/integrations/api-key).
  
  **How to get your API key:**
  1. Go to the [Short.io Dashboard](https://app.short.io/settings/integrations/api-key)
  2. Sign in to your account
  3. Navigate to Integrations & API section and go to API tab
  4. Create a new API key or copy an existing one
  5. Paste the key here
  `,
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await shortioApiCall({
        apiKey: auth as string,
        method: HttpMethod.GET,
        resourceUri: '/api/domains',
      });

      if (response && typeof response === 'object') {
        return { 
          valid: true,
          message: 'API key validated successfully. Connected to Short.io.' 
        };
      }

      return {
        valid: false,
        error: 'Invalid API response format. Please check your API key.',
      };
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your API key and try again.',
        };
      }

      return {
        valid: false,
        error: `API call failed: ${error.message}`,
      };
    }
  }

});

export async function shortioApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  resourceUri,
  query,
  body,
}: ShortioApiCallParams): Promise<T> {
  const qs: QueryParams = {};

	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== null && value !== undefined) {
				qs[key] = String(value);
			}
		}
	}

  const request: HttpRequest = {
    method,
    url: BASE_URL + resourceUri,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      Authorization: apiKey,
    },
    queryParams: qs,
    body
  }

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please check your API key.');
    }
    throw new Error(`API call failed: ${error.message}`);
  }
}

export const shortioCommon = {
  domain_id: Property.Dropdown({
    displayName: 'Domain',
    description: 'Select the domain to use for the link',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Short.io account first',
        };
      }

      try {
        const response = await shortioApiCall<ShortioApiDomain[]>({
          apiKey: auth as string,
          method: HttpMethod.GET,
          resourceUri: '/api/domains',
        });

        return {
          disabled: false,
          options: response.map((domain) => ({
            label: domain.hostname,
            value: String(domain.id),
          })),
          placeholder: response.length === 0 ? 'No domains available' : 'Select a domain',
        };
      } catch (error: any) {
        return {
          disabled: true,
          options: [],
          placeholder: `Error loading domains: ${error.message}`,
        };
      }
    }
  })
};
