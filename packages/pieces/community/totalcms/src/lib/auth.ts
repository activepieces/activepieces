import { AppConnectionValueForAuthProperty, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';


export function totalcmsBaseUrl(domain: string): string {
  return domain.trim().replace(/\/+$/, '');
}

export const cmsAuth = PieceAuth.CustomAuth({
  displayName: 'Total CMS Connection',
  description: `Connect a Total CMS 3 site.

1. Sign in to your Total CMS admin.
2. Go to **Utilities → API Keys** (or open \`/admin/utils/api-keys\`).
3. Click **Create New API Key**, give it a name, choose the HTTP methods and endpoints Activepieces may use (all endpoints is simplest), and copy the key. It is shown only once.
4. Paste your site address and the key below.

API keys need the Pro edition of Total CMS (local development domains such as localhost include it).`,
  props: {
    domain: Property.ShortText({
      displayName: 'Site URL',
      description: 'The address of your Total CMS site, e.g. https://www.example.com',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'A Total CMS API key, starting with tcms_',
      required: true,
    }),
  },
  required: true,
  async validate({ auth }) {
    let base: string;
    try {
      const url = new URL(totalcmsBaseUrl(auth.domain));
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return { valid: false, error: 'The Site URL must start with http:// or https://.' };
      }
      base = totalcmsBaseUrl(auth.domain);
    } catch {
      return { valid: false, error: 'The Site URL is not a valid web address.' };
    }
    try {
      const response = await httpClient.sendRequest<unknown>({
        method: HttpMethod.GET,
        url: `${base}/api/collections`,
        headers: { 'X-API-Key': auth.apiKey.trim(), Accept: 'application/json' },
        followRedirects: false,
      });
      if (response.status >= 300) {
        return {
          valid: false,
          error: 'The Site URL redirects to another address. Enter the final address of your site (check https:// and www).',
        };
      }
      if (!hasDataList(response.body)) {
        return {
          valid: false,
          error: 'This Site URL did not answer like a Total CMS 3 API. Check the address (Total CMS 1 and 2 are not supported).',
        };
      }
      return { valid: true };
    } catch (e) {
      const status = errorStatus(e);
      if (status === 401 || status === 403) {
        return {
          valid: false,
          error: 'Total CMS rejected the API key. Check the key and that it allows GET requests.',
        };
      }
      if (status === 404) {
        return {
          valid: false,
          error: 'No Total CMS 3 API was found at this Site URL. Check the address (Total CMS 1 and 2 are not supported).',
        };
      }
      return {
        valid: false,
        error: 'Could not reach the Total CMS site. Check the Site URL and that the site is online.',
      };
    }
  },
});

function errorStatus(error: unknown): number | undefined {
  if (error === null || typeof error !== 'object') {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (response === null || typeof response !== 'object') {
    return undefined;
  }
  const status: unknown = Reflect.get(response, 'status');
  return typeof status === 'number' ? status : undefined;
}

function hasDataList(body: unknown): boolean {
  if (body === null || typeof body !== 'object') {
    return false;
  }
  return Array.isArray(Reflect.get(body, 'data'));
}

export type TotalCMSAuthType = AppConnectionValueForAuthProperty<typeof cmsAuth>;
