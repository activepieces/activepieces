import { ApiClient } from 'docusign-esign';
import { docusignAuth, DocusignAuthType } from '../index';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

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
    auth.props.scopes.split(','),
    Buffer.from(auth.props.privateKey.replace(/\\n/g, '\n'), 'utf-8'),
    10 * 60 // 10mn lifetime
  );
  const accessToken = results.body.access_token;
  dsApi.addDefaultHeader('Authorization', `Bearer ${accessToken}`);
  return dsApi;
}
