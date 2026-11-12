import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { YoutrackApiError, youtrackClient } from './common/client';

async function validateConnection({ baseUrlInput, apiTokenInput }: { baseUrlInput: unknown; apiTokenInput: unknown }): Promise<{ valid: true } | { valid: false; error: string }> {
  const checked = youtrackClient.checkBaseUrl(baseUrlInput);
  if (!checked.ok) {
    return { valid: false, error: checked.error };
  }
  const token = youtrackClient.optionalText(apiTokenInput);
  if (token === undefined) {
    return { valid: false, error: 'Enter your YouTrack permanent token.' };
  }
  const checkedUrl = `${checked.baseUrl}/api/users/me`;
  try {
    const body = await youtrackClient.send<unknown>({
      baseUrl: checked.baseUrl,
      token,
      method: HttpMethod.GET,
      path: '/users/me',
      query: { fields: 'id,login' },
      operation: 'read the current user to check the connection',
    });
    if (!youtrackClient.isRecord(body) || youtrackClient.optionalText(body['login'] ?? body['id']) === undefined) {
      return {
        valid: false,
        error: `This does not look like a YouTrack URL: ${checkedUrl} did not return a YouTrack user. Use the address you open YouTrack at, for example https://example.youtrack.cloud, and keep a context path such as /youtrack.`,
      };
    }
    return { valid: true };
  } catch (error) {
    if (error instanceof YoutrackApiError) {
      if (error.status === 401) {
        return {
          valid: false,
          error: `YouTrack rejected the permanent token (HTTP 401). Check that you copied the whole token (it starts with "perm:") and that it was not revoked. ${error.message}`,
        };
      }
      if (error.status === 403) {
        return {
          valid: false,
          error: `YouTrack refused the permanent token (HTTP 403). The token may lack the YouTrack scope, or the account may be banned. ${error.message}`,
        };
      }
      if ((error.status >= 300 && error.status < 400) || error.status === 404) {
        return {
          valid: false,
          error: `This does not look like a YouTrack URL (got HTTP ${error.status} from ${checkedUrl}). Use the address you open YouTrack at; keep a context path such as /youtrack. ${error.message}`,
        };
      }
      return { valid: false, error: error.message };
    }
    const reason = error instanceof Error ? error.message : String(error);
    return { valid: false, error: `Could not reach ${checked.baseUrl}. ${reason}` };
  }
}

export const youtrackAuth = PieceAuth.CustomAuth({
  displayName: 'YouTrack Connection',
  description:
    'Connect your YouTrack instance.\n\n' +
    '**How to get your permanent token:**\n' +
    '1. Log in to your YouTrack instance\n' +
    '2. Click your avatar -> **Profile** -> **Account Security** (older versions: **Authentication**)\n' +
    '3. Click **New token**, give it the **YouTrack** scope\n' +
    '4. Name it (e.g. "Activepieces") and click **Create**\n' +
    '5. **Copy the token immediately** - it is shown only once\n' +
    '6. Paste it below with your Instance URL\n\n' +
    'Your **Instance URL** is your browser address, e.g. https://example.youtrack.cloud. A YouTrack Server installed under a path keeps it, e.g. https://example.com/youtrack. The server must use a TLS certificate from a trusted certificate authority.',
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Instance URL',
      description: 'Your YouTrack URL (e.g. https://example.youtrack.cloud or https://example.com/youtrack). Do NOT include /api.',
      required: true,
    }),
    apiToken: PieceAuth.SecretText({
      displayName: 'Permanent Token',
      description: 'From Profile -> Account Security -> Tokens. Starts with "perm:".',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    return validateConnection({ baseUrlInput: auth.baseUrl, apiTokenInput: auth.apiToken });
  },
});
