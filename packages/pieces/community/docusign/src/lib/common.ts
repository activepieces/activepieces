import { ApiClient } from 'docusign-esign';
import { DocusignAuthType } from '../index';
import { AxiosError } from 'axios';
import { ServerContext } from '@activepieces/pieces-framework';

export async function createApiClient(
  auth: DocusignAuthType,
  server: ServerContext
) {
  const oAuthBasePath =
    auth.environment === 'demo'
      ? 'account-d.docusign.com'
      : 'account.docusign.com';
  const dsApi = new ApiClient({
    basePath: `https://${auth.environment}.docusign.net/restapi`,
    oAuthBasePath,
  });
  try {
    const results = await dsApi.requestJWTUserToken(
      auth.clientId,
      auth.impersonatedUserId,
      auth.scopes.split(','),
      Buffer.from(auth.privateKey.replace(/\\n/g, '\n'), 'utf-8'),
      10 * 60 // 10mn lifetime
    );
    const accessToken = results.body.access_token;
    dsApi.addDefaultHeader('Authorization', `Bearer ${accessToken}`);
    return dsApi;
  } catch (error) {
    if (
      error instanceof AxiosError &&
      error.response &&
      error.response.status === 400 &&
      error.response.data &&
      error.response.data.error === 'consent_required'
    ) {
      const formattedScopes = auth.scopes.split(',').join(encodeURI(' '));
      // We don't use the built-in getAuthorizationUri method from docusign
      // because it currently limits the scopes that can be requested to signature, extended, and impersonation
      const consentUrl =
        'https://' +
        dsApi.getOAuthBasePath() +
        '/oauth/auth' +
        '?response_type=code' +
        '&scope=' +
        formattedScopes +
        '&client_id=' +
        auth.clientId +
        '&redirect_uri=' +
        encodeURIComponent(`${server.publicUrl}/redirect`);
      throw new Error(
        JSON.stringify({
          message:
            'Consent is required, please visit this URL and grant consent',
          url: consentUrl,
        })
      );
    }
    throw error;
  }
}
