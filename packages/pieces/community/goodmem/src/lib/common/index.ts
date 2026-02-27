import { AppConnectionValueForAuthProperty, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { goodmemAuth } from '../../index';

export interface GoodMemAuthConfig {
  baseUrl: string;
  apiKey: string;
}

export function extractAuthFromContext(auth: AppConnectionValueForAuthProperty<typeof goodmemAuth>): GoodMemAuthConfig {
  if (typeof auth === 'string') {
    throw new Error('Invalid auth format');
  }
  
  const actualAuth = auth.props;
  
  if (!actualAuth || !actualAuth.baseUrl || !actualAuth.apiKey) {
    throw new Error('Invalid authentication: Base URL and API Key are required');
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
    'Accept': 'application/json',
  };
}

function extractDropdownAuth(auth: any): { baseUrl: string; apiKey: string } {
  const authProps = auth?.props || auth;
  return {
    baseUrl: (authProps?.baseUrl || '').replace(/\/$/, ''),
    apiKey: authProps?.apiKey || '',
  };
}

function apiHeaders(apiKey: string): Record<string, string> {
  return { 'X-API-Key': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' };
}

export const spaceIdDropdown = Property.Dropdown<string, true, typeof goodmemAuth>({
  displayName: 'Space',
  description: 'Select a space to use',
  required: true,
  refreshers: [],
  auth: goodmemAuth,
  async options({ auth }) {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your GoodMem account first', options: [] };
    }
    try {
      const { baseUrl, apiKey } = extractDropdownAuth(auth);
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/v1/spaces`,
        headers: apiHeaders(apiKey),
      });
      const body = response.body;
      const spaces = Array.isArray(body) ? body : (body?.spaces || []);
      return {
        disabled: false,
        options: spaces.map((s: any) => ({
          label: s.name || s.spaceId || 'Unnamed',
          value: s.spaceId || s.id,
        })),
      };
    } catch (error) {
      return { disabled: true, placeholder: 'Failed to load spaces. Check your connection.', options: [] };
    }
  },
});

export const multiSpaceDropdown = Property.MultiSelectDropdown<string, true, typeof goodmemAuth>({
  displayName: 'Spaces',
  description: 'Select one or more spaces to search across',
  required: true,
  refreshers: [],
  auth: goodmemAuth,
  async options({ auth }) {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your GoodMem account first', options: [] };
    }
    try {
      const { baseUrl, apiKey } = extractDropdownAuth(auth);
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/v1/spaces`,
        headers: apiHeaders(apiKey),
      });
      const body = response.body;
      const spaces = Array.isArray(body) ? body : (body?.spaces || []);
      return {
        disabled: false,
        options: spaces.map((s: any) => ({
          label: s.name || s.spaceId || 'Unnamed',
          value: s.spaceId || s.id,
        })),
      };
    } catch (error) {
      return { disabled: true, placeholder: 'Failed to load spaces. Check your connection.', options: [] };
    }
  },
});

export const rerankerDropdown = Property.Dropdown<string, false, typeof goodmemAuth>({
  displayName: 'Reranker',
  description: 'Optional reranker model to improve result ordering',
  required: false,
  refreshers: [],
  auth: goodmemAuth,
  async options({ auth }) {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your GoodMem account first', options: [] };
    }
    try {
      const { baseUrl, apiKey } = extractDropdownAuth(auth);
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/v1/rerankers`,
        headers: apiHeaders(apiKey),
      });
      const body = response.body;
      const rerankers = Array.isArray(body) ? body : (body?.rerankers || []);
      return {
        disabled: false,
        options: rerankers.map((r: any) => ({
          label: `${r.displayName || r.name || r.modelIdentifier || 'Unnamed'} (${r.modelIdentifier || r.model || 'unknown'})`,
          value: r.rerankerId || r.id,
        })),
      };
    } catch (error) {
      return { disabled: true, placeholder: 'Failed to load rerankers. Check your connection.', options: [] };
    }
  },
});

export const llmDropdown = Property.Dropdown<string, false, typeof goodmemAuth>({
  displayName: 'LLM',
  description: 'Optional LLM to generate contextual responses alongside retrieved chunks',
  required: false,
  refreshers: [],
  auth: goodmemAuth,
  async options({ auth }) {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your GoodMem account first', options: [] };
    }
    try {
      const { baseUrl, apiKey } = extractDropdownAuth(auth);
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/v1/llms`,
        headers: apiHeaders(apiKey),
      });
      const body = response.body;
      const llms = Array.isArray(body) ? body : (body?.llms || []);
      return {
        disabled: false,
        options: llms.map((l: any) => ({
          label: `${l.displayName || l.name || l.model_identifier || l.modelIdentifier || 'Unnamed'} (${l.model_identifier || l.modelIdentifier || l.model || 'unknown'})`,
          value: l.llmId || l.id,
        })),
      };
    } catch (error) {
      return { disabled: true, placeholder: 'Failed to load LLMs. Check your connection.', options: [] };
    }
  },
});
