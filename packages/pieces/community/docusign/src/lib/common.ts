import { ApiClient } from 'docusign-esign';
import { DocusignAuthType } from '../index';

export async function createApiClient(auth: DocusignAuthType) {
  const oAuthBasePath =
    auth.environment === 'demo'
      ? 'account-d.docusign.com'
      : 'account.docusign.com';
  const dsApi = new ApiClient({
    basePath: `https://${auth.environment}.docusign.net/restapi`,
    oAuthBasePath,
  });

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
}
