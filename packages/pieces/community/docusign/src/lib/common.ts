import { ApiClient } from 'docusign-esign';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { docusignAuth } from './auth';

function normalizePrivateKey(key: string): string {
  const normalized = key
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  // When a PEM key is pasted into a single-line <input type="password">, the
  // browser strips all newlines. Reconstruct proper PEM formatting so that
  // Node's createPrivateKey (called internally by jsonwebtoken) accepts it.
  const pemMatch = normalized.match(
    /^(-----BEGIN [^-]+-----)([A-Za-z0-9+/=\s]*)(-----END [^-]+-----)$/
  );
  if (pemMatch) {
    const [, header, rawBody, footer] = pemMatch;
    const body = rawBody.replace(/\s+/g, '');
    const lines = body.match(/.{1,64}/g) ?? [];
    return [header, ...lines, footer].join('\n');
  }

  return normalized;
}

export async function createApiClient(
  auth: AppConnectionValueForAuthProperty<typeof docusignAuth>
) {
  const oAuthBasePath =
    auth.props.environment === 'demo'
      ? 'account-d.docusign.com'
      : 'account.docusign.com';
  const dsApi = new ApiClient({
    basePath: `https://${auth.props.environment}.docusign.net/restapi`,
    oAuthBasePath,
  });

  const results = await dsApi.requestJWTUserToken(
    auth.props.clientId,
    auth.props.impersonatedUserId,
    auth.props.scopes.split(',').map((s) => s.trim()),
    Buffer.from(normalizePrivateKey(auth.props.privateKey), 'utf-8'),
    10 * 60 // 10mn lifetime
  );
  const accessToken = results.body.access_token;
  dsApi.addDefaultHeader('Authorization', `Bearer ${accessToken}`);
  return dsApi;
}
