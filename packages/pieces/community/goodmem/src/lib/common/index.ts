import {
  AppConnectionValueForAuthProperty,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { goodmemAuth } from '../../index';

export interface GoodMemAuthConfig {
  baseUrl: string;
  apiKey: string;
}

export function extractAuthFromContext(
  auth: AppConnectionValueForAuthProperty<typeof goodmemAuth>
): GoodMemAuthConfig {
  if (typeof auth === 'string') {
    throw new Error('Invalid auth format');
  }

  const actualAuth = auth.props;

  if (!actualAuth || !actualAuth.baseUrl || !actualAuth.apiKey) {
    throw new Error(
      'Invalid authentication: Base URL and API Key are required'
    );
  }

  return {
    baseUrl: actualAuth.baseUrl,
    apiKey: actualAuth.apiKey,
  };
}

export function getBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

export function getCommonHeaders(apiKey: string): Record<string, string> {
  return {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export const spaceIdDropdown = Property.Dropdown<
  string,
  true,
  typeof goodmemAuth
>({
  displayName: 'Space',
  description: 'Select a space to use',
  required: true,
  refreshers: ['auth'],
  auth: goodmemAuth,
  async options({ auth }) {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your GoodMem account first',
        options: [],
      };
    }
    try {
      const { baseUrl, apiKey } = auth.props;
      const baseUrlClean = baseUrl.replace(/\/$/, '');
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrlClean}/v1/spaces`,
        headers: getCommonHeaders(apiKey),
      });
      const body = response.body;
      const spaces = Array.isArray(body) ? body : (body?.spaces ?? []);
      return {
        disabled: false,
        options: spaces.map((s: any) => ({
          label: s.name,
          value: s.spaceId,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load spaces. Check your connection.',
        options: [],
      };
    }
  },
});

export const multiSpaceDropdown = Property.MultiSelectDropdown<
  string,
  true,
  typeof goodmemAuth
>({
  displayName: 'Spaces',
  description: 'Select one or more spaces to search across',
  required: true,
  refreshers: ['auth'],
  auth: goodmemAuth,
  async options({ auth }) {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your GoodMem account first',
        options: [],
      };
    }
    try {
      const { baseUrl, apiKey } = auth.props;
      const baseUrlClean = baseUrl.replace(/\/$/, '');
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrlClean}/v1/spaces`,
        headers: getCommonHeaders(apiKey),
      });
      const body = response.body;
      const spaces = Array.isArray(body) ? body : (body?.spaces ?? []);
      return {
        disabled: false,
        options: spaces.map((s: any) => ({
          label: s.name,
          value: s.spaceId,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load spaces. Check your connection.',
        options: [],
      };
    }
  },
});

export const rerankerDropdown = Property.Dropdown<
  string,
  false,
  typeof goodmemAuth
>({
  displayName: 'Reranker',
  description: 'Optional reranker model to improve result ordering',
  required: false,
  refreshers: ['auth'],
  auth: goodmemAuth,
  async options({ auth }) {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your GoodMem account first',
        options: [],
      };
    }
    try {
      const { baseUrl, apiKey } = auth.props;
      const baseUrlClean = baseUrl.replace(/\/$/, '');
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrlClean}/v1/rerankers`,
        headers: getCommonHeaders(apiKey),
      });
      const body = response.body;
      const rerankers = Array.isArray(body) ? body : (body?.rerankers ?? []);
      return {
        disabled: false,
        options: rerankers.map((r: any) => ({
          label: r.displayName,
          value: r.rerankerId,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load rerankers. Check your connection.',
        options: [],
      };
    }
  },
});

export const llmDropdown = Property.Dropdown<string, false, typeof goodmemAuth>(
  {
    displayName: 'LLM',
    description:
      'Optional LLM to generate contextual responses alongside retrieved chunks',
    required: false,
    refreshers: ['auth'],
    auth: goodmemAuth,
    async options({ auth }) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your GoodMem account first',
          options: [],
        };
      }
      try {
        const { baseUrl, apiKey } = auth.props;
        const baseUrlClean = baseUrl.replace(/\/$/, '');
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${baseUrlClean}/v1/llms`,
          headers: getCommonHeaders(apiKey),
        });
        const body = response.body;
        const llms = Array.isArray(body) ? body : (body?.llms ?? []);
        return {
          disabled: false,
          options: llms.map((l: any) => ({
            label: l.displayName,
            value: l.llmId,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to load LLMs. Check your connection.',
          options: [],
        };
      }
    },
  }
);
